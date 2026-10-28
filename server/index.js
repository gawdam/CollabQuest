import 'dotenv/config'
import express from 'express'
import { ApifyClient } from 'apify-client'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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
app.get('/api/health', (request, response) => response.json({ status: 'ok' }))

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

async function getInstagramMetrics(username, token) {
  const client = new ApifyClient({ token })
  const run = await client.actor('apify/instagram-scraper').call({
    resultsType: 'details',
    directUrls: [`https://www.instagram.com/${username}/`],
    resultsLimit: 6,
    searchType: 'profile',
    searchLimit: 1,
    addParentData: false,
  })
  if (!run.defaultDatasetId) {
    throw new Error(`Apify returned no dataset for @${username}.`)
  }

  const { items } = await client.dataset(run.defaultDatasetId).listItems()
  const profile = items.find((item) => typeof item.username === 'string'
    && item.username.toLowerCase() === username.toLowerCase())
  if (!profile) {
    throw new Error(`Apify returned no Instagram profile for @${username}.`)
  }

  const followers = Number.isFinite(profile.followersCount) ? profile.followersCount : null
  const postEngagementRates = followers > 0
    ? (Array.isArray(profile.latestPosts) ? profile.latestPosts : [])
      .slice(0, 6)
      .flatMap((post) => {
        const likes = post.likesCount
        const comments = post.commentsCount
        return Number.isFinite(likes) && likes >= 0 && Number.isFinite(comments) && comments >= 0
          ? [(likes + comments) / followers * 100]
          : []
      })
      .sort((first, second) => first - second)
    : []
  const middleIndex = Math.floor(postEngagementRates.length / 2)
  const engagementRate = postEngagementRates.length
    ? postEngagementRates.length % 2
      ? postEngagementRates[middleIndex]
      : (postEngagementRates[middleIndex - 1] + postEngagementRates[middleIndex]) / 2
    : null

  return {
    followers,
    engagementRate,
    engagementPostCount: postEngagementRates.length,
  }
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

app.post('/api/influencers/metrics', async (request, response) => {
  const { usernames } = request.body || {}
  if (
    !Array.isArray(usernames)
    || usernames.length !== 1
    || usernames.some((username) => typeof username !== 'string' || !/^[A-Za-z0-9._]{1,30}$/.test(username))
  ) {
    return response.status(400).json({ error: 'Provide one valid Instagram username.' })
  }

  const token = process.env.APIFY_TOKEN
  if (!token) return response.status(503).json({ error: 'Apify is not configured on this server.' })

  const [username] = usernames
  try {
    const metrics = await getInstagramMetrics(username, token)
    return response.json({ metrics: { [username]: metrics } })
  } catch (error) {
    console.error(`Apify Instagram metrics lookup failed for @${username}:`, error)
    return response.status(502).json({ error: error.message || `Could not retrieve Instagram details for @${username}.` })
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
      entities,
      hasMore: sourceResults.some((source) => source.length === batchTake),
    })
  } catch (error) {
    console.error('Qloo influencer search failed:', error.message)
    const status = error.status >= 400 && error.status < 500 ? error.status : 502
    return response.status(status).json({ error: error.message || 'Could not retrieve influencer recommendations.' })
  }
})

export default app

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  app.listen(port, () => console.log(`Qloo API proxy listening on http://localhost:${port}`))
}