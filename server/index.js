import 'dotenv/config'
import express from 'express'

const app = express()
const port = Number(process.env.PORT) || 3001
const qlooBaseUrl = 'https://hackathon.api.qloo.com/v2'

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

app.post('/api/recommendations', async (request, response) => {
  const { ageRange, gender, description, location, followers, category } = request.body || {}
  const followerCount = Number(followers)
  if (!ageRange || !description?.trim() || !location?.trim() || !Number.isFinite(followerCount)) {
    return response.status(400).json({ error: 'Add a content description, location, age range, and follower count.' })
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
      take: '10',
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

app.listen(port, () => console.log(`Qloo API proxy listening on http://localhost:${port}`))