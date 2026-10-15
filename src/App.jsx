import { useState } from 'react'
import { ArrowDownWideNarrow, ArrowUpRight, Building2, CircleAlert, Eye, EyeOff, LoaderCircle, MapPin, Search, Sparkles, Users } from 'lucide-react'
import './App.css'

const categories = ['Travel', 'Beauty', 'Fashion', 'Fitness', 'Food', 'Gaming', 'Lifestyle', 'Technology', 'Wellness']
const ageRanges = ['18_to_24', '25_to_29', '30_to_34', '35_to_44', '45_to_54', '55_to_64', '65_plus']
const qlooBaseUrl = 'https://hackathon.api.qloo.com/v2'
const initialForm = {
  apiKey: '', ageRange: '25_to_29', gender: 'male',
  description: 'I create travel vlogs and explore new destinations',
  location: 'London', followers: 85000, category: 'Travel',
}

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
  if (!response.ok) throw new Error(data.message || data.error || `Qloo request failed (${response.status})`)
  return data
}

async function getRecommendations({ apiKey, ageRange, gender, description, location, followers, category }) {
  const tagParams = new URLSearchParams({
    'feature.typo_tolerance': 'true',
    'filter.query': `${category || ''} ${description}`.trim(),
    'feature.semantic_search': 'true',
    page: '1',
    take: '10',
  })
  const tagData = await qlooGet('tags', tagParams, apiKey)
  const tagUrns = (tagData.results?.tags || []).map((tag) => tag.id).filter(Boolean)
  if (!tagUrns.length) return []

  const [popularityMin, popularityMax] = getPopularityRange(Number(followers))
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
  return insightData.results?.entities || []
}

function BrandCard({ brand, index }) {
  const name = brand.name || 'Untitled brand'
  const affinity = Number(brand.query?.affinity ?? 0)
  const imageUrl = brand.properties?.image?.url || brand.image?.url
  return (
    <article className="brand-card" style={{ '--card-index': index }}>
      <div className={`brand-mark mark-${index % 5}`} aria-hidden="true">
        {imageUrl ? <img src={imageUrl} alt="" /> : <span>{name.slice(0, 1).toUpperCase()}</span>}
      </div>
      <div className="brand-copy"><span className="brand-rank">MATCH {String(index + 1).padStart(2, '0')}</span><h3>{name}</h3><p>{brand.properties?.short_description || brand.properties?.description || 'A brand aligned with your creator profile'}</p></div>
      <div className="affinity"><span className="affinity-value">{Math.round(affinity * 100)}<small>%</small></span><span className="affinity-label">affinity</span><div className="affinity-track"><span style={{ width: `${Math.max(0, Math.min(100, affinity * 100))}%` }} /></div></div>
      <ArrowUpRight className="brand-arrow" size={17} aria-hidden="true" />
    </article>
  )
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [showApiKey, setShowApiKey] = useState(false)
  const [brands, setBrands] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: name === 'followers' ? Number(value) : value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const entities = await getRecommendations(form)
      setBrands(entities.sort((a, b) => Number(b.query?.affinity ?? 0) - Number(a.query?.affinity ?? 0)))
      setHasSearched(true)
    } catch (requestError) {
      setError(requestError.message || 'Something went wrong. Please try again.')
      setHasSearched(true)
      setBrands([])
    } finally {
      setLoading(false)
    }
  }

  const followerLabel = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(form.followers)
  const creatorTier = form.followers < 10000 ? 'Nano creator' : form.followers < 50000 ? 'Micro creator' : form.followers < 100000 ? 'Mid-tier creator' : form.followers < 500000 ? 'Macro creator' : form.followers < 1000000 ? 'Top creator' : 'Celebrity creator'

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Signal home"><span className="wordmark-icon"><Sparkles size={16} /></span><span>signal<span className="wordmark-period">.</span></span></a>
        <div className="topbar-note"><span className="status-dot" /> CREATOR INTELLIGENCE <span className="topbar-divider">/</span> BRAND DISCOVERY</div>
        <a className="topbar-link" href="https://qloo.com" target="_blank" rel="noreferrer">Powered by Qloo <ArrowUpRight size={14} /></a>
      </header>
      <main id="top" className="workspace">
        <section className="intro"><div className="eyebrow"><span>01</span> THE CREATOR MATCHER</div><h1>Find your next<br /><em>brand match.</em></h1><p>Turn your audience and point of view into a shortlist of brands that belong in your world.</p><div className="intro-stamp" aria-hidden="true"><span>CREATOR</span><Sparkles size={19} /><span>× BRAND</span></div></section>
        <div className="workspace-grid">
          <aside className="brief-panel">
            <div className="panel-heading"><div><span className="section-kicker">YOUR PROFILE</span><h2>Build a brief</h2></div><span className="step-count">01 <span>/ 01</span></span></div>
            <form onSubmit={handleSubmit}>
              <fieldset className="field-group api-key-group"><legend>Qloo access</legend><label className="field"><span>API key</span><span className="api-key-control"><input name="apiKey" type={showApiKey ? 'text' : 'password'} value={form.apiKey} onChange={updateField} placeholder="Enter your Qloo API key" autoComplete="off" required /><button className="api-key-toggle" type="button" onClick={() => setShowApiKey((visible) => !visible)} aria-label={showApiKey ? 'Hide API key' : 'Show API key'}>{showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label><p className="api-key-note">Used for this request only; never saved.</p></fieldset>
              <fieldset className="field-group"><legend>Audience</legend><div className="field-pair">
                <label className="field"><span>Age range</span><select name="ageRange" value={form.ageRange} onChange={updateField}>{ageRanges.map((range) => <option key={range} value={range}>{range.replace('_to_', '–').replace('_plus', '+')}</option>)}</select></label>
                <label className="field"><span>Gender</span><select name="gender" value={form.gender} onChange={updateField}><option value="female">Female</option><option value="male">Male</option><option value="any">Any</option></select></label>
              </div><label className="field location-field"><span>Audience location</span><span className="input-with-icon"><MapPin size={16} /><input name="location" value={form.location} onChange={updateField} placeholder="City or region" required /></span></label></fieldset>
              <fieldset className="field-group creator-group"><legend>Your content</legend><label className="field"><span>What do you make?</span><textarea name="description" value={form.description} onChange={updateField} placeholder="Describe your content and audience..." rows="3" required /></label><label className="field"><span>Content category</span><select name="category" value={form.category} onChange={updateField}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label></fieldset>
              <fieldset className="field-group follower-group"><legend>Audience size</legend><div className="follower-readout"><span className="follower-value"><Users size={17} /> {followerLabel}</span><span className="tier-label">{creatorTier}</span></div><input className="follower-slider" type="range" name="followers" min="1000" max="1000000" step="1000" value={form.followers} onChange={updateField} aria-label="Follower count" /><div className="range-labels"><span>1K</span><span>250K</span><span>500K</span><span>1M+</span></div></fieldset>
              <button className="submit-button" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={17} /> Finding matches</> : <><Search size={17} /> Find brand matches <ArrowUpRight size={16} /></>}</button>
              <p className="privacy-note">Your brief stays private. Only matching signals are sent to Qloo.</p>
            </form>
          </aside>
          <section className="results-panel" aria-live="polite">
            <div className="results-heading"><div><span className="section-kicker">THE SHORTLIST</span><h2>{hasSearched ? 'Your brand matches' : 'Made for your signal'}</h2></div><div className="results-count">{hasSearched && !error ? <><span>{String(brands.length).padStart(2, '0')}</span> RESULTS</> : <><ArrowDownWideNarrow size={16} /> AFFINITY RANKED</>}</div></div>
            {loading ? <div className="state-panel loading-state"><LoaderCircle className="spin" size={27} /><p>Reading your audience signals<span>Finding brands with a natural fit.</span></p></div>
              : error ? <div className="state-panel error-state"><CircleAlert size={24} /><h3>Couldn’t find matches</h3><p>{error}</p><span>Check your Qloo API key and try again.</span></div>
                : hasSearched && brands.length === 0 ? <div className="state-panel"><div className="empty-mark"><Search size={23} /></div><h3>No matches this time</h3><p>Try broadening the content description or changing the location.</p></div>
                  : hasSearched ? <div className="brand-list">{brands.map((brand, index) => <BrandCard key={brand.entity_id || brand.id || `${brand.name}-${index}`} brand={brand} index={index} />)}</div>
                    : <div className="results-empty"><div className="orbit-art" aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="orbit-core"><Sparkles size={23} /></span><span className="orbit-node node-one" /><span className="orbit-node node-two" /><span className="orbit-node node-three" /></div><span className="empty-overline">A BETTER KIND OF SPONSORSHIP</span><h3>Good partnerships<br />feel <em>inevitable.</em></h3><p>Set your creator signals and we’ll surface brands with an audience affinity to match.</p><div className="signal-tags"><span><Users size={13} /> Audience</span><span><Building2 size={13} /> Brand fit</span><span><MapPin size={13} /> Place</span></div></div>}
            {hasSearched && brands.length > 0 && <p className="results-footnote">Affinity scores reflect audience alignment, not a guarantee of partnership.</p>}
          </section>
        </div>
      </main>
      <footer className="site-footer"><span>© 2026 SIGNAL STUDIO</span><span>BUILT FOR THE NEXT GOOD COLLABORATION <span className="footer-star">✳</span></span></footer>
    </div>
  )
}

export default App
