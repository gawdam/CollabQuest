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

app.post('/api/reel-concept', async (request, response) => {
  const { brandContext, creatorProfile } = request.body || {}
  const requiredBrandFields = [
    'brand_name',
    'target_audience',
    'emotional_tone',
    'aesthetics',
    'situational_contexts',
    'interest_adjacencies',
  ]
  const isValidText = (value, maxLength) => typeof value === 'string'
    && value.trim().length > 0
    && value.length <= maxLength
  if (
    !brandContext || typeof brandContext !== 'object'
    || requiredBrandFields.some((field) => !isValidText(brandContext[field], 1000))
    || !creatorProfile || typeof creatorProfile !== 'object'
    || !isValidText(creatorProfile.niche, 200)
    || !isValidText(creatorProfile.content_style, 500)
    || (creatorProfile.audience_demographics !== undefined && !isValidText(creatorProfile.audience_demographics, 300))
    || (creatorProfile.recent_viral_reel !== undefined && creatorProfile.recent_viral_reel !== '' && !isValidText(creatorProfile.recent_viral_reel, 500))
    || (creatorProfile.product_name !== undefined && creatorProfile.product_name !== '' && !isValidText(creatorProfile.product_name, 300))
  ) {
    return response.status(400).json({ error: 'Provide complete brand intelligence and creator profile details.' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return response.status(503).json({ error: 'Gemini is not configured on this server.' })

  const prompt = `# ROLE
You are a Social Media Strategist creating quick-pitch concepts for brand partnerships.

# BRAND INTELLIGENCE (FROM QLOO)
- Brand Name: ${brandContext.brand_name.trim()}
- Target Audience: ${brandContext.target_audience.trim()}
- Emotional Tone: ${brandContext.emotional_tone.trim()}
- Aesthetic Style: ${brandContext.aesthetics.trim()}
- Best Situational Contexts: ${brandContext.situational_contexts.trim()}
- Key Interest Adjacencies: ${brandContext.interest_adjacencies.trim()}

# CREATOR PROFILE
- Niche: ${creatorProfile.niche.trim()}
- Content Style: ${creatorProfile.content_style.trim()}
- Audience Demographics: ${creatorProfile.audience_demographics?.trim() || 'Not specified'}
- Product the Creator Likes: ${creatorProfile.product_name?.trim() || 'Choose a relevant brand product'}
${creatorProfile.recent_viral_reel?.trim() ? `- Recent Viral Reel Worth Mentioning: ${creatorProfile.recent_viral_reel.trim()}` : ''}

---

# TASK
Create a detailed, practical Reel concept based on the brand's Qloo insights and this creator's profile. Feature the specific product the creator likes, and make the idea feel authentic to the brand's audience, emotional tone, aesthetic, interests, and situational contexts.

# OUTPUT FORMAT
Write a single line explaining the concept in a way that could be used as a pitch to the brand. Include the product or brand name in the reel concept.

Output only the concept, with no title, preamble, or labels. Make it specific enough to film; do not stop mid-sentence. Do not use em-dashes "—".`

  try {
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          thinkingConfig: { thinkingLevel: 'low' },
          maxOutputTokens: 700,
        },
      }),
      signal: AbortSignal.timeout(20000),
    })
    const data = await geminiResponse.json().catch(() => ({}))
    if (!geminiResponse.ok) {
      const error = new Error(data.error?.message || `Gemini request failed (${geminiResponse.status})`)
      error.status = geminiResponse.status
      throw error
    }

    const concept = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim()
      .replace(/^["']|["']$/g, '')
    if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
      throw new Error('Gemini reached the concept output limit. Please try again.')
    }
    if (!concept) throw new Error('Gemini returned no Reel concept.')

    return response.json({ concept })
  } catch (error) {
    console.error('Gemini Reel concept request failed:', error.message)
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return response.status(504).json({ error: 'Reel concept generation timed out. Please try again.' })
    }
    return response.status(502).json({ error: 'Could not generate a Reel concept. Please try again.' })
  }
})

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
  const {
    ageRange, gender, description, location, followers, category,
    pastBrandPartnerships = '', page = 1,
  } = request.body || {}
  const followerCount = Number(followers)
  const resultPage = Number(page)
  if (!ageRange || !description?.trim() || !location?.trim() || !Number.isFinite(followerCount)) {
    return response.status(400).json({ error: 'Add a content description, location, age range, and follower count.' })
  }
  if (typeof pastBrandPartnerships !== 'string' || pastBrandPartnerships.length > 2000) {
    return response.status(400).json({ error: 'Past brand partnerships must be a text list under 2,000 characters.' })
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
    const partnershipNames = [...new Set(pastBrandPartnerships
      .split(/[,\n\r]+/)
      .map((name) => name.trim())
      .filter(Boolean))]
    if (partnershipNames.length > 10 || partnershipNames.some((name) => name.length > 100)) {
      return response.status(400).json({ error: 'Enter up to 10 past brand names, each no longer than 100 characters.' })
    }

    const tagParams = new URLSearchParams({
      'feature.typo_tolerance': 'true',
      'filter.query': `${category || ''} ${description}`.trim(),
      'feature.semantic_search': 'true', page: '1', take: '10',
    })
    const tagData = await qlooGet('tags', tagParams, apiKey)
    const tagUrns = (tagData.results?.tags || []).map((tag) => tag.id).filter(Boolean)

    const brandEntities = await Promise.all(partnershipNames.map(async (brandName) => {
      const searchParams = new URLSearchParams({
        query: brandName,
        'filter.type': 'urn:entity:brand',
        take: '1',
      })
      const searchData = await qlooGet('search', searchParams, apiKey)
      const match = searchData.results?.entities?.[0] || searchData.results?.[0]
      return match?.id || match?.entity_id || null
    }))
    const brandEntityIds = [...new Set(brandEntities.filter(Boolean))]
    if (!tagUrns.length && !brandEntityIds.length) return response.json({ entities: [] })

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
    if (brandEntityIds.length) insightParams.set('signal.interests.entities', brandEntityIds.join(','))

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