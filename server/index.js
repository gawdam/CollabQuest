import 'dotenv/config'
import express from 'express'
import puppeteer from 'puppeteer'

const app = express()
const port = Number(process.env.PORT) || 3001
const qlooBaseUrl = 'https://hackathon.api.qloo.com/v2'
const supportedAgeRanges = new Set([
  '24_and_younger',
  '25_to_29',
  '30_to_34',
  '35_to_44',
  '45_to_54',
  '55_and_older',
])
const supportedCreatorTags = new Set([
  'urn:tag:genre:person:academic',
  'urn:tag:genre:person:activist',
  'urn:tag:genre:person:actor',
  'urn:tag:genre:person:athlete',
  'urn:tag:genre:person:author',
  'urn:tag:genre:person:chef',
  'urn:tag:genre:person:comedian',
  'urn:tag:genre:person:fashion_designer',
  'urn:tag:genre:person:influencer',
  'urn:tag:genre:person:journalist',
  'urn:tag:genre:person:lawyer',
  'urn:tag:genre:person:model',
  'urn:tag:genre:person:musician',
  'urn:tag:genre:person:politician',
  'urn:tag:genre:person:youtuber',
])

app.use(express.json({ limit: '20kb' }))

function getPopularityRange(followerCount) {
  if (followerCount < 10000) return [0, 0.2]
  if (followerCount < 50000) return [0.2, 0.4]
  if (followerCount < 100000) return [0.4, 0.7]
  if (followerCount < 500000) return [0.7, 0.85]
  if (followerCount < 1000000) return [0.85, 0.95]
  return [0.95, 1]
}

async function qlooGet(path, params, apiKey) {
  const url = new URL(`${qlooBaseUrl}/${path}`)
  url.search = params.toString()
  const response = await fetch(url, { headers: { 'X-Api-Key': apiKey, accept: 'application/json' } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || data.error || `Qloo request failed (${response.status})`)
    error.status = response.status
    throw error
  }
  return data
}

function getInstagramUsername(entry) {
  const profile = Array.isArray(entry) ? entry[0] : entry
  if (!profile) return null

  const value = typeof profile === 'string'
    ? profile
    : profile.url || profile.href || profile.username || profile.handle || profile.id || profile.value
  if (typeof value !== 'string' || !value.trim()) return null

  const normalized = value.trim().replace(/^@/, '')
  let username = normalized
  if (/^https?:\/\//i.test(normalized)) {
    try {
      const url = new URL(normalized)
      if (!['instagram.com', 'www.instagram.com'].includes(url.hostname.toLowerCase())) return null
      username = url.pathname.split('/').filter(Boolean)[0] || ''
    } catch {
      return null
    }
  }

  if (!/^[A-Za-z0-9._]+$/.test(username) || /^(accounts|about|developer|direct|explore|legal|p|reel|reels|stories)$/i.test(username)) {
    return null
  }
  return username
}

function parseInstagramFollowerCount(content) {
  const match = content.match(/([\d.,]+)\s*([KkMmBb]?)\s+Followers/i)
  if (!match) return null

  return parseInstagramCount(match[1], match[2])
}

function parseInstagramCount(value, suffix = '') {
  const count = Number(value.replace(/,/g, ''))
  const multiplier = { '': 1, k: 1_000, m: 1_000_000, b: 1_000_000_000 }[suffix.toLowerCase()]
  return Number.isFinite(count) ? Math.round(count * multiplier) : null
}

function parseInstagramPostEngagement(content) {
  const likesMatch = content.match(/([\d.,]+)\s*([KkMmBb]?)\s+likes?\b/i)
  const commentsMatch = content.match(/([\d.,]+)\s*([KkMmBb]?)\s+comments?\b/i)
  if (!likesMatch || !commentsMatch) return null

  const likes = parseInstagramCount(likesMatch[1], likesMatch[2])
  const comments = parseInstagramCount(commentsMatch[1], commentsMatch[2])
  return likes === null || comments === null ? null : likes + comments
}

async function getInstagramMetrics(browser, username) {
  const page = await browser.newPage()
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    const profile = await page.evaluate((profileUsername) => {
      const description = document.querySelector('meta[property="og:description"]')?.content || ''
      const posts = [...document.querySelectorAll('a[href]')].flatMap((anchor) => {
        const url = new URL(anchor.href)
        const [linkedUsername, type, shortcode] = url.pathname.split('/').filter(Boolean)
        return url.hostname.endsWith('instagram.com')
          && linkedUsername?.toLowerCase() === profileUsername.toLowerCase()
          && ['p', 'reel', 'tv'].includes(type)
          && shortcode
          ? [`https://www.instagram.com/${linkedUsername}/${type}/${shortcode}/`]
          : []
      })
      return { description, posts: [...new Set(posts)] }
    }, username)
    const followers = parseInstagramFollowerCount(profile.description)
    const postEngagements = []

    for (const postUrl of profile.posts.slice(0, 9)) {
      try {
        await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
        const description = await page.evaluate(() =>
          document.querySelector('meta[property="og:description"]')?.content
          || document.querySelector('meta[name="description"]')?.content
          || '',
        )
        const engagement = parseInstagramPostEngagement(description)
        if (engagement !== null) postEngagements.push(engagement)
      } catch (error) {
        console.error(`Instagram post metrics lookup failed for @${username}:`, error)
      }
    }

    const postEngagementRates = postEngagements
      .map((engagement) => engagement / followers * 100)
      .sort((first, second) => first - second)
    const middleIndex = Math.floor(postEngagementRates.length / 2)
    const engagementRate = followers && postEngagementRates.length
      ? postEngagementRates.length % 2
        ? postEngagementRates[middleIndex]
        : (postEngagementRates[middleIndex - 1] + postEngagementRates[middleIndex]) / 2
      : null
    return { followers, engagementRate, engagementPostCount: postEngagements.length }
  } finally {
    await page.close()
  }
}

async function addInstagramMetrics(entities) {
  const entityUsernames = entities.map((entity) => getInstagramUsername(
    entity.external?.instagram_username || entity.external?.instagram,
  ))
  const usernames = [...new Set(entityUsernames.filter(Boolean))]
  const metricsByUsername = new Map()

  if (usernames.length > 0) {
    let browser
    try {
      browser = await puppeteer.launch({ headless: true })
      for (let index = 0; index < usernames.length; index += 5) {
        const batch = usernames.slice(index, index + 5)
        const results = await Promise.all(batch.map(async (username) => {
          try {
            return [username, await getInstagramMetrics(browser, username)]
          } catch (error) {
            console.error(`Instagram metrics lookup failed for @${username}:`, error)
            return [username, { followers: null, engagementRate: null, engagementPostCount: 0 }]
          }
        }))
        for (const [username, metrics] of results) metricsByUsername.set(username, metrics)
      }
    } catch (error) {
      console.error('Could not launch browser for Instagram metrics lookups:', error)
      for (const username of usernames) {
        metricsByUsername.set(username, { followers: null, engagementRate: null, engagementPostCount: 0 })
      }
    } finally {
      if (browser) await browser.close()
    }
  }

  return entities.map((entity, index) => {
    const username = entityUsernames[index]
    return username ? {
      ...entity,
      instagramFollowers: metricsByUsername.get(username)?.followers ?? null,
      instagramEngagementRate: metricsByUsername.get(username)?.engagementRate ?? null,
      instagramEngagementPostCount: metricsByUsername.get(username)?.engagementPostCount ?? 0,
    } : entity
  })
}

app.post('/api/recommendations', async (request, response) => {
  const { ageRange, gender, description, location, followers, category, page = 1 } = request.body || {}
  const followerCount = Number(followers)
  const resultPage = Number(page)
  if (!ageRange || !description?.trim() || !location?.trim() || !Number.isFinite(followerCount)) {
    return response.status(400).json({ error: 'Add a content description, location, age range, and follower count.' })
  }
  if (!Number.isInteger(resultPage) || resultPage < 1) {
    return response.status(400).json({ error: 'Page must be a positive integer.' })
  }
  if (followerCount < 1000 || followerCount > 1000000) {
    return response.status(400).json({ error: 'Follower count must be between 1,000 and 1,000,000.' })
  }

  const apiKey = process.env.QLOO_API_KEY
  if (!apiKey) return response.status(503).json({ error: 'Qloo is not configured on this server.' })

  try {
    const tagParams = new URLSearchParams({
      'feature.typo_tolerance': 'true',
      'filter.query': `${category || ''} ${description}`.trim(),
      'feature.semantic_search': 'true', page: '1', take: '10',
    })
    const tagData = await qlooGet('tags', tagParams, apiKey)
    const tagUrns = (tagData.results?.tags || []).map((tag) => tag.id).filter(Boolean)
    if (!tagUrns.length) return response.json({ entities: [] })

    const [popularityMin, popularityMax] = getPopularityRange(followerCount)
    const insightParams = new URLSearchParams({
      'filter.type': 'urn:entity:brand',
      'signal.demographics.age': ageRange,
      'signal.interests.tags': tagUrns.join(','),
      'signal.location.query': location.trim(),
      'filter.popularity.min': String(popularityMin),
      'filter.popularity.max': String(popularityMax),
      page: String(resultPage),
      take: '50',
    })
    if (gender && gender !== 'any') insightParams.set('signal.demographics.gender', gender)

    const insightData = await qlooGet('insights/', insightParams, apiKey)
    return response.json({ entities: insightData.results?.entities || [] })
  } catch (error) {
    console.error('Qloo recommendation request failed:', error.message)
    const status = error.status >= 400 && error.status < 500 ? error.status : 502
    return response.status(status).json({ error: error.message || 'Could not retrieve brand recommendations.' })
  }
})

app.post('/api/influencers', async (request, response) => {
  const {
    product, location, ageRanges, creatorTags: selectedCreatorTags = [], gender = 'any',
    popularityTier, page = 1,
  } = request.body || {}
  const tierIndex = Number(popularityTier)
  const resultPage = Number(page)
  if (
    typeof product !== 'string' || !product.trim()
    || typeof location !== 'string' || !location.trim()
    || !Array.isArray(ageRanges) || ageRanges.length === 0
    || ageRanges.some((ageRange) => !supportedAgeRanges.has(ageRange))
    || !Array.isArray(selectedCreatorTags)
    || selectedCreatorTags.some((tag) => typeof tag !== 'string' || !supportedCreatorTags.has(tag))
    || !['female', 'male', 'any'].includes(gender)
    || !Number.isInteger(tierIndex) || tierIndex < 0 || tierIndex > 3
    || !Number.isInteger(resultPage) || resultPage < 1
  ) {
    return response.status(400).json({ error: 'Add a product, location, at least one valid age group, gender, and popularity tier.' })
  }

  const apiKey = process.env.QLOO_API_KEY
  if (!apiKey) return response.status(503).json({ error: 'Qloo is not configured on this server.' })

  try {
    const resolveTags = async (keyword) => {
      const tagParams = new URLSearchParams({
        'filter.query': keyword,
        'feature.semantic_search': 'true',
        take: '5',
      })
      const tagData = await qlooGet('tags', tagParams, apiKey)
      return (tagData.results?.tags || []).map((tag) => tag.id).filter(Boolean)
    }
    const tagUrns = [...new Set(await resolveTags(product.trim()))]

    const tier = [
      { min: 0.1, max: 0.3 },
      { min: 0.3, max: 0.5 },
      { min: 0.5, max: 0.7 },
      { min: 0.7 },
    ][tierIndex]
    const batchTake = 50
    const creatorTags = [...new Set(selectedCreatorTags.length
      ? selectedCreatorTags
      : ['urn:tag:genre:person:influencer'])]
    const selectedAgeRanges = [...new Set(ageRanges)]
    const requests = selectedAgeRanges.map(async (ageRange) => {
      const insightParams = new URLSearchParams({
        'filter.type': 'urn:entity:person',
        'operator.signal.interests.tags': 'union',
        'signal.location.query': location.trim(),
        'signal.interests.tags': tagUrns.join(','),
        'operator.filter.tags': 'union',
        'filter.tags': creatorTags.join(','),
        'signal.demographics.age': ageRange,
        'filter.popularity.min': String(tier.min),
        page: String(resultPage),
        take: String(batchTake),
      })
      if (tier.max !== undefined) insightParams.set('filter.popularity.max', String(tier.max))
      if (gender !== 'any') insightParams.set('filter.demographics.gender', gender)
      const data = await qlooGet('insights/', insightParams, apiKey)
      return data.results?.entities || []
    })

    const sourceResults = await Promise.all(requests)
    const entities = []
    const seen = new Set()
    for (const source of sourceResults) {
      for (const entity of source) {
        const id = entity.entity_id || entity.id || entity.name
        if (!id || seen.has(id)) continue
        seen.add(id)
        entities.push(entity)
      }
    }
    return response.json({
      entities: await addInstagramMetrics(entities),
      hasMore: sourceResults.some((source) => source.length === batchTake),
    })
  } catch (error) {
    console.error('Qloo influencer search failed:', error.message)
    const status = error.status >= 400 && error.status < 500 ? error.status : 502
    return response.status(status).json({ error: error.message || 'Could not retrieve influencer recommendations.' })
  }
})

app.listen(port, () => console.log(`Qloo API proxy listening on http://localhost:${port}`))