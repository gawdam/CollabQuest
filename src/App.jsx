import { useState } from 'react'
import { ArrowDownWideNarrow, ArrowLeft, ArrowUpRight, AtSign, Building2, CircleAlert, Globe, Link2, LoaderCircle, MapPin, Search, Sparkles, Users } from 'lucide-react'
import './App.css'

const categories = ['Travel', 'Beauty', 'Fashion', 'Fitness', 'Food', 'Gaming', 'Lifestyle', 'Technology', 'Wellness']
const ageRanges = [
  { value: '24_and_younger', label: 'Young Gen Z (under 25)' },
  { value: '25_to_29', label: 'Late Gen Z (25–29)' },
  { value: '30_to_34', label: 'Young Millennials (30–34)' },
  { value: '35_to_44', label: 'Late Millennials (35–44)' },
  { value: '45_to_54', label: 'Generation X (45–54)' },
  { value: '55_and_older', label: 'Baby Boomers (55 and older)' },
]
const creatorTags = [
  { label: 'Academic', urn: 'urn:tag:genre:person:academic' },
  { label: 'Activist', urn: 'urn:tag:genre:person:activist' },
  { label: 'Actor', urn: 'urn:tag:genre:person:actor' },
  { label: 'Athlete', urn: 'urn:tag:genre:person:athlete' },
  { label: 'Author', urn: 'urn:tag:genre:person:author' },
  { label: 'Chef', urn: 'urn:tag:genre:person:chef' },
  { label: 'Comedian', urn: 'urn:tag:genre:person:comedian' },
  { label: 'Fashion Designer', urn: 'urn:tag:genre:person:fashion_designer' },
  { label: 'Influencer', urn: 'urn:tag:genre:person:influencer' },
  { label: 'Journalist', urn: 'urn:tag:genre:person:journalist' },
  { label: 'Lawyer', urn: 'urn:tag:genre:person:lawyer' },
  { label: 'Model', urn: 'urn:tag:genre:person:model' },
  { label: 'Musician', urn: 'urn:tag:genre:person:musician' },
  { label: 'Politician', urn: 'urn:tag:genre:person:politician' },
  { label: 'YouTuber', urn: 'urn:tag:genre:person:youtuber' },
]
const initialForm = {
  ageRange: '25_to_29', gender: 'male',
  description: 'I create travel vlogs and explore new destinations',
  location: 'London', followers: 85000, category: 'Travel',
}
const initialInfluencerForm = {
  product: '', location: 'London', ageRanges: ['30_to_34'], creatorTags: [], gender: 'Any', popularityTier: 2,
}

async function getRecommendations(endpoint, request) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Recommendation request failed (${response.status})`)
  return { entities: data.entities || [], hasMore: Boolean(data.hasMore) }
}

function BrandCard({ brand, index }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const name = brand.name || 'Untitled brand'
  const affinity = Number(brand.query?.affinity ?? 0)
  const properties = brand.properties || {}
  const imageUrl = properties.image?.url || brand.image?.url
  const description = properties.description || properties.short_description || 'A brand aligned with your creator profile.'
  const audience = properties.target_demographics_description
    || properties.audience_identity
    || (Array.isArray(properties.customer_segments) ? properties.customer_segments.join(', ') : '')
  const products = Array.isArray(properties.products_services) && properties.products_services.length
    ? properties.products_services
    : Array.isArray(properties.products) ? properties.products : []
  const incomeLevels = Array.isArray(properties.target_income_level)
    ? properties.target_income_level
    : properties.target_income_level ? [properties.target_income_level] : []
  const influencerAppeal = Array.isArray(properties.influencer_appeal) ? properties.influencer_appeal : []
  const coreValues = Array.isArray(properties.core_values) ? properties.core_values : []
  const instagramEntry = brand.external?.instagram
  const instagramProfile = Array.isArray(instagramEntry) ? instagramEntry[0] : instagramEntry
  const instagramHandle = (typeof instagramProfile === 'string'
    ? instagramProfile
    : instagramProfile?.id || instagramProfile?.username || instagramProfile?.handle)?.replace(/^@/, '')
  const instagramUrl = instagramHandle && /^[A-Za-z0-9._]+$/.test(instagramHandle)
    ? `https://www.instagram.com/${instagramHandle}/`
    : null
  const detailsId = `brand-details-${brand.entity_id || index}`

  return (
    <article className={`brand-card${isFlipped ? ' is-flipped' : ''}`} style={{ '--card-index': index }}>
      <button
        className="brand-card-front"
        type="button"
        onClick={() => setIsFlipped(true)}
        aria-label={`Show details for ${name}`}
        aria-expanded={isFlipped}
        aria-controls={detailsId}
        inert={isFlipped}
      >
        <span className={`brand-mark mark-${index % 5}`} aria-hidden="true">
          {imageUrl ? <img src={imageUrl} alt="" /> : <span>{name.slice(0, 1).toUpperCase()}</span>}
        </span>
        <span className="brand-copy"><span className="brand-rank">MATCH {String(index + 1).padStart(2, '0')}</span><span className="brand-name">{name}</span><span className="brand-summary">{properties.short_description || description}</span></span>
        <span className="affinity"><span className="affinity-value">{Math.round(affinity * 100)}<small>%</small></span><span className="affinity-label">affinity</span><span className="affinity-track"><span style={{ width: `${Math.max(0, Math.min(100, affinity * 100))}%` }} /></span></span>
        <ArrowUpRight className="brand-arrow" size={17} aria-hidden="true" />
      </button>
      <section
        className="brand-card-back"
        id={detailsId}
        aria-label={`${name} details`}
        aria-hidden={!isFlipped}
        inert={!isFlipped}
      >
        <div className="brand-details">
          <div className="brand-details-heading">
            <span className="brand-rank">BRAND PROFILE</span>
            <h3>{name}</h3>
            <button className="brand-back-button" type="button" onClick={() => setIsFlipped(false)}>
              <ArrowLeft size={14} /> Back to match
            </button>
          </div>
          <p className="brand-description">{description}</p>
          {audience && <p className="brand-audience"><strong>Customers</strong>{audience}</p>}
          {properties.founded_year && <p className="brand-established"><strong>Established</strong>{properties.founded_year}</p>}
          {products.length > 0 && <div className="brand-detail-group"><strong>Products sold</strong><div className="brand-chips">{products.map((product) => <span key={product}>{product}</span>)}</div></div>}
          {incomeLevels.length > 0 && <div className="brand-detail-group"><strong>Target income</strong><div className="brand-chips">{incomeLevels.map((level) => <span key={level}>{level}</span>)}</div></div>}
          {influencerAppeal.length > 0 && <div className="brand-detail-group"><strong>Influencer appeal</strong><div className="brand-chips">{influencerAppeal.map((type) => <span key={type}>{type}</span>)}</div></div>}
          {coreValues.length > 0 && <div className="brand-detail-group"><strong>Core values</strong><div className="brand-chips">{coreValues.map((value) => <span key={value}>{value}</span>)}</div></div>}
        </div>
        <aside className="brand-social">
          <span className="brand-social-label">FOLLOW ALONG</span>
          {instagramUrl
            ? <a className="instagram-link" href={instagramUrl} target="_blank" rel="noreferrer"><AtSign size={17} /><span>@{instagramHandle}</span><ArrowUpRight size={13} /></a>
            : <span className="instagram-unavailable">No Instagram listed</span>}
        </aside>
      </section>
    </article>
  )
}

function getSocialUrl(entry, platform) {
  const profile = Array.isArray(entry) ? entry[0] : entry
  if (!profile) return null

  const value = typeof profile === 'string'
    ? profile
    : profile.url || profile.href || profile.username || profile.handle || profile.id || profile.value
  if (typeof value !== 'string' || !value.trim()) return null

  const normalized = value.trim().replace(/^@/, '')
  if (/^https?:\/\//i.test(normalized)) {
    try {
      const url = new URL(normalized)
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null
    } catch {
      return null
    }
  }

  if (platform === 'website') return null
  if (!/^[A-Za-z0-9._]+$/.test(normalized)) return null
  return platform === 'instagram'
    ? `https://www.instagram.com/${normalized}/`
    : `https://twitter.com/${normalized}`
}

function getShortDescription(value) {
  if (typeof value === 'string') return value.trim()
  if (!Array.isArray(value)) return ''

  const descriptions = value.filter((item) => typeof item?.value === 'string' && item.value.trim())
  const englishDescription = descriptions.find((item) => item.language?.toLowerCase() === 'en')
  return (englishDescription || descriptions[0])?.value.trim() || ''
}

function InfluencerCard({ person, index }) {
  const name = person.name || 'Unknown creator'
  const affinity = Number(person.query?.affinity ?? 0)
  const properties = person.properties || {}
  const imageUrl = properties.image?.url || person.image?.url
  const description = getShortDescription(properties.short_descriptions)
  const instagramUrl = getSocialUrl(person.external?.instagram_username || person.external?.instagram, 'instagram')
  const twitterUrl = getSocialUrl(person.external?.twitter_username || person.external?.twitter, 'twitter')
  const websiteUrl = getSocialUrl(properties.official_website || person.external?.website || properties.website, 'website')
  const creatorTypes = person.creatorTypes || [person.creatorType || 'influencer']

  return (
    <article className="brand-card influencer-card" style={{ '--card-index': index }}>
      <span className={`brand-mark mark-${index % 5}`} aria-hidden="true">
        {imageUrl ? <img src={imageUrl} alt="" /> : <span>{name.slice(0, 1).toUpperCase()}</span>}
      </span>
      <span className="brand-copy">
        <span className="brand-name">{name}<span className="creator-platforms">{creatorTypes.map((type) => type === 'youtuber'
          ? <span className="creator-platform youtube-platform" key={type} aria-label="YouTube" title="YouTube"><svg viewBox="0 0 24 18" aria-hidden="true"><path d="M23.5 2.8a3 3 0 0 0-2.1-2.1C19.5.2 12 .2 12 .2s-7.5 0-9.4.5A3 3 0 0 0 .5 2.8 31 31 0 0 0 0 9s0 3.4.5 6.2a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 9s0-3.4-.5-6.2Z" /><path className="platform-play" d="m9.6 12.8 6.2-3.8-6.2-3.8z" /></svg></span>
          : <span className="creator-platform instagram-platform" key={type} aria-label="Instagram" title="Instagram"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="2" width="16" height="16" rx="4" /><circle cx="10" cy="10" r="3.5" /><circle className="instagram-dot" cx="14.8" cy="5.4" r="1" /></svg></span>)}</span></span>
        <span className="brand-summary">{description}</span>
        <span className="influencer-socials">
          {instagramUrl && <a className="influencer-social" href={instagramUrl} target="_blank" rel="noreferrer" aria-label={`${name} on Instagram`}><AtSign size={14} /><span>Instagram</span><ArrowUpRight size={11} /></a>}
          {twitterUrl && <a className="influencer-social" href={twitterUrl} target="_blank" rel="noreferrer" aria-label={`${name} on Twitter`}><Link2 size={14} /><span>Twitter</span><ArrowUpRight size={11} /></a>}
          {websiteUrl && <a className="influencer-social" href={websiteUrl} target="_blank" rel="noreferrer" aria-label={`${name} website`}><Globe size={14} /><span>Website</span><ArrowUpRight size={11} /></a>}
        </span>
      </span>
      <span className="affinity"><span className="affinity-value">{Math.round(affinity * 100)}<small>%</small></span><span className="affinity-label">affinity</span><span className="affinity-track"><span style={{ width: `${Math.max(0, Math.min(100, affinity * 100))}%` }} /></span></span>
      <ArrowUpRight className="brand-arrow" size={17} aria-hidden="true" />
    </article>
  )
}

function App() {
  const [role, setRole] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [influencerForm, setInfluencerForm] = useState(initialInfluencerForm)
  const [brands, setBrands] = useState([])
  const [resultPage, setResultPage] = useState(0)
  const [nextApiPage, setNextApiPage] = useState(2)
  const [hasMoreResults, setHasMoreResults] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [resultSearch, setResultSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [creatorType, setCreatorType] = useState('both')
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: name === 'followers' ? Number(value) : value }))
  }

  function updateInfluencerField(event) {
    const { name, value } = event.target
    setInfluencerForm((current) => ({
      ...current,
      [name]: name === 'popularityTier' ? Number(value) : value,
    }))
  }

  function toggleAgeRange(value) {
    setInfluencerForm((current) => ({
      ...current,
      ageRanges: current.ageRanges.includes(value)
        ? current.ageRanges.filter((ageRange) => ageRange !== value)
        : [...current.ageRanges, value],
    }))
  }

  function toggleCreatorTag(urn) {
    setInfluencerForm((current) => ({
      ...current,
      creatorTags: current.creatorTags.includes(urn)
        ? current.creatorTags.filter((tag) => tag !== urn)
        : [...current.creatorTags, urn],
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (role === 'brand' && influencerForm.ageRanges.length === 0) {
      setError('Select at least one age group.')
      setHasSearched(true)
      setBrands([])
      setHasMoreResults(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const isBrand = role === 'brand'
      const request = isBrand
        ? { ...influencerForm, popularityTier: Number(influencerForm.popularityTier), creatorType: 'both', page: 1 }
        : form
      const { entities, hasMore } = await getRecommendations(
        isBrand ? '/api/influencers' : '/api/recommendations',
        request,
      )
      setBrands(entities.sort((a, b) => Number(b.query?.affinity ?? 0) - Number(a.query?.affinity ?? 0)))
      setResultPage(0)
      setNextApiPage(2)
      setHasMoreResults(isBrand ? hasMore : entities.length === 50)
      setHasSearched(true)
    } catch (requestError) {
      setError(requestError.message || 'Something went wrong. Please try again.')
      setHasSearched(true)
      setBrands([])
      setHasMoreResults(false)
    } finally {
      setLoading(false)
    }
  }

  const followerLabel = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(form.followers)
  const creatorTier = form.followers < 10000 ? 'Nano creator' : form.followers < 50000 ? 'Micro creator' : form.followers < 100000 ? 'Mid-tier creator' : form.followers < 500000 ? 'Macro creator' : form.followers < 1000000 ? 'Top creator' : 'Celebrity creator'

  function chooseRole(nextRole) {
    setRole(nextRole)
    setBrands([])
    setHasSearched(false)
    setError('')
    setResultPage(0)
    setNextApiPage(2)
    setHasMoreResults(false)
    setResultSearch('')
    setCountryFilter('')
    setGenderFilter('')
  }

  const countries = [...new Set(brands.flatMap((person) => {
    const citizenship = person.properties?.citizenship
    return (Array.isArray(citizenship) ? citizenship : citizenship ? [citizenship] : [])
      .filter((country) => typeof country === 'string' && country.trim())
  }))].sort((a, b) => a.localeCompare(b))
  const filteredBrands = brands.filter((item) => {
    const properties = item.properties || {}
    const query = resultSearch.trim().toLocaleLowerCase()
    const searchableText = `${item.name || ''} ${getShortDescription(properties.short_descriptions)} ${properties.description || ''}`.toLocaleLowerCase()
    const citizenship = Array.isArray(properties.citizenship)
      ? properties.citizenship
      : properties.citizenship ? [properties.citizenship] : []
    const genders = Array.isArray(properties.gender) ? properties.gender : properties.gender ? [properties.gender] : []
    const itemCreatorTypes = item.creatorTypes || [item.creatorType || 'influencer']
    const matchesCreatorType = role !== 'brand' || creatorType === 'both'
      || (creatorType === 'youtubers' ? itemCreatorTypes.includes('youtuber') : itemCreatorTypes.includes('influencer'))
    return (!query || searchableText.includes(query))
      && (!countryFilter || citizenship.includes(countryFilter))
      && (!genderFilter || genders.some((gender) => typeof gender === 'string' && gender.toLowerCase() === genderFilter))
      && matchesCreatorType
  })
  const pageCount = Math.max(1, Math.ceil(filteredBrands.length / 10))
  const visiblePage = Math.min(resultPage, pageCount - 1)
  const visibleBrands = filteredBrands.slice(visiblePage * 10, visiblePage * 10 + 10)

  async function changeResultPage(nextPage) {
    if (nextPage < 0 || loadingMore) return
    const isLastLoadedPage = nextPage >= pageCount
    if (isLastLoadedPage && hasMoreResults) {
      setLoadingMore(true)
      setError('')
      try {
        const page = nextApiPage
        const isBrand = role === 'brand'
        const { entities, hasMore } = await getRecommendations(
          isBrand ? '/api/influencers' : '/api/recommendations',
          isBrand
            ? { ...influencerForm, popularityTier: Number(influencerForm.popularityTier), creatorType: 'both', page }
            : { ...form, page },
        )
        setBrands((current) => {
          const seen = new Set(current.map((entity) => entity.entity_id || entity.id || entity.name))
          return [...current, ...entities.filter((entity) => {
            const key = entity.entity_id || entity.id || entity.name
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })].sort((a, b) => Number(b.query?.affinity ?? 0) - Number(a.query?.affinity ?? 0))
        })
        setHasMoreResults(isBrand ? hasMore : entities.length === 50)
        setNextApiPage(page + 1)
        setResultPage(nextPage)
      } catch (requestError) {
        setError(requestError.message || 'Could not load more results.')
      } finally {
        setLoadingMore(false)
      }
      return
    }
    setResultPage(nextPage)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Signal home"><span className="wordmark-icon"><Sparkles size={16} /></span><span>signal<span className="wordmark-period">.</span></span></a>
        <div className="topbar-note"><span className="status-dot" /> CREATOR INTELLIGENCE <span className="topbar-divider">/</span> BRAND DISCOVERY</div>
        {role && <button className="topbar-link role-switch" type="button" onClick={() => chooseRole(null)}><ArrowLeft size={14} /> Change path</button>}
        {!role && <span className="topbar-link">AUDIENCE + CULTURE SIGNALS</span>}
      </header>
      <main id="top" className="workspace">
        {!role ? (
          <>
            <section className="intro"><div className="eyebrow"><span>01</span> THE COLLABORATION MATCHER</div><h1>Find your next<br /><em>great match.</em></h1><p>Tell us which side of the collaboration you’re on. We’ll find the right fit.</p><div className="intro-stamp" aria-hidden="true"><span>CREATOR</span><Sparkles size={19} /><span>× BRAND</span></div></section>
            <section className="role-picker" aria-labelledby="role-heading">
              <span className="section-kicker">LET’S GET STARTED</span>
              <h2 id="role-heading">Which best describes you?</h2>
              <p>Choose a path to find a collaboration that makes sense for you.</p>
              <div className="role-options">
                <button className="role-card" type="button" onClick={() => chooseRole('influencer')}>
                  <span className="role-icon"><Users size={22} /></span>
                  <span className="role-card-copy"><strong>Influencer looking for a brand</strong><small>Find brands that fit your audience and content.</small></span>
                  <ArrowUpRight size={18} />
                </button>
                <button className="role-card" type="button" onClick={() => chooseRole('brand')}>
                  <span className="role-icon"><Building2 size={22} /></span>
                  <span className="role-card-copy"><strong>Brand looking for an influencer</strong><small>Discover creators aligned with your product and style.</small></span>
                  <ArrowUpRight size={18} />
                </button>
              </div>
              <a className="role-powered" href="https://qloo.com" target="_blank" rel="noreferrer">Powered by Qloo <ArrowUpRight size={13} /></a>
            </section>
          </>
        ) : <>
        <section className="intro"><div className="eyebrow"><span>01</span> {role === 'brand' ? 'THE BRAND MATCHER' : 'THE CREATOR MATCHER'}</div><h1>{role === 'brand' ? <>Meet your next<br /><em>creator match.</em></> : <>Find your next<br /><em>brand match.</em></>}</h1><p>{role === 'brand' ? 'Find creators whose interests and style connect with your product.' : 'Turn your audience and point of view into a shortlist of brands that belong in your world.'}</p><div className="intro-stamp" aria-hidden="true"><span>{role === 'brand' ? 'BRAND' : 'CREATOR'}</span><Sparkles size={19} /><span>× {role === 'brand' ? 'CREATOR' : 'BRAND'}</span></div></section>
        <div className="workspace-grid">
          <aside className="brief-panel">
            <div className="panel-heading"><div><span className="section-kicker">{role === 'brand' ? 'YOUR CAMPAIGN' : 'YOUR PROFILE'}</span><h2 className={role === 'brand' ? 'preserve-font-size' : ''}>{role === 'brand' ? 'Find creators' : 'Build a brief'}</h2></div><span className="step-count">01 <span>/ 01</span></span></div>
            <form onSubmit={handleSubmit}>
              {role === 'brand' ? <>
                <fieldset className="field-group"><legend>Product</legend>
                  <label className="field"><span>What product are you promoting?</span><input name="product" value={influencerForm.product} onChange={updateInfluencerField} placeholder="e.g. sneakers" required /></label>
                </fieldset>
                <fieldset className="field-group"><legend>Audience</legend>
                  <div className="field-pair">
                    <label className="field"><span>Gender</span><select name="gender" value={influencerForm.gender} onChange={updateInfluencerField}><option value="female">Female</option><option value="male">Male</option><option value="any">Any</option></select></label>
                    <label className="field"><span>Location</span><span className="input-with-icon"><MapPin size={16} /><input name="location" value={influencerForm.location} onChange={updateInfluencerField} placeholder="City or region" required /></span></label>
                  </div>
                  <fieldset className="generation-filter">
                    <legend>Generations</legend>
                    <div className="generation-options">
                      {ageRanges.map(({ value, label }) => (
                        <button
                          className={`creator-tag${influencerForm.ageRanges.includes(value) ? ' is-selected' : ''}`}
                          type="button"
                          key={value}
                          aria-pressed={influencerForm.ageRanges.includes(value)}
                          onClick={() => toggleAgeRange(value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </fieldset>
                <fieldset className="field-group creator-group">
                  <legend>Creator</legend>
                  <fieldset className="creator-tag-filter">
                    <legend>Category</legend>
                    <div className="creator-tag-options">
                      {creatorTags.map(({ label, urn }) => {
                        const isSelected = influencerForm.creatorTags.includes(urn)
                        return (
                          <button
                            className={`creator-tag${isSelected ? ' is-selected' : ''}`}
                            type="button"
                            key={urn}
                            aria-pressed={isSelected}
                            onClick={() => toggleCreatorTag(urn)}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>
                  <fieldset className="budget-filter">
                    <legend>Budget</legend>
                    <input className="follower-slider" type="range" name="popularityTier" min="0" max="3" step="1" value={influencerForm.popularityTier} onChange={updateInfluencerField} aria-label="Budget" />
                    <div className="range-labels budget-labels" aria-hidden="true"><span>$</span><span>$$</span><span>$$$</span><span>$$$$</span></div>
                  </fieldset>
                </fieldset>
              </> : <>
                <fieldset className="field-group"><legend>Audience</legend><div className="field-pair">
                  <label className="field"><span>Age range</span><select name="ageRange" value={form.ageRange} onChange={updateField}>{['24_and_younger', '25_to_29', '30_to_34', '35_to_44', '45_to_54', '55_and_older'].map((range) => <option key={range} value={range}>{range.replace('_to_', '–').replace('_plus', '+')}</option>)}</select></label>
                  <label className="field"><span>Gender</span><select name="gender" value={form.gender} onChange={updateField}><option value="female">Female</option><option value="male">Male</option><option value="any">Any</option></select></label>
                </div><label className="field location-field"><span>Audience location</span><span className="input-with-icon"><MapPin size={16} /><input name="location" value={form.location} onChange={updateField} placeholder="City or region" required /></span></label></fieldset>
                <fieldset className="field-group creator-group"><legend>Your content</legend><label className="field"><span>What do you make?</span><textarea name="description" value={form.description} onChange={updateField} placeholder="Describe your content and audience..." rows="3" required /></label><label className="field"><span>Content category</span><select name="category" value={form.category} onChange={updateField}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label></fieldset>
                <fieldset className="field-group follower-group"><legend>Audience size</legend><div className="follower-readout"><span className="follower-value"><Users size={17} /> {followerLabel}</span><span className="tier-label">{creatorTier}</span></div><input className="follower-slider" type="range" name="followers" min="1000" max="1000000" step="1000" value={form.followers} onChange={updateField} aria-label="Follower count" /><div className="range-labels"><span>1K</span><span>250K</span><span>500K</span><span>1M+</span></div></fieldset>
              </>}
              <button className="submit-button" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={17} /> Finding matches</> : <><Search size={17} /> Find {role === 'brand' ? 'influencers' : 'brand matches'} <ArrowUpRight size={16} /></>}</button>
              <p className="privacy-note">Your brief stays private. Only matching signals are sent to Qloo.</p>
            </form>
          </aside>
          <section className="results-panel" aria-live="polite">
            <div className="results-heading"><div><span className="section-kicker">THE SHORTLIST</span><h2 className={!hasSearched ? 'preserve-font-size' : ''}>{hasSearched ? (role === 'brand' ? 'Your influencer matches' : 'Your brand matches') : 'Made for your signal'}</h2></div><div className="results-count">{hasSearched && !error ? <><span>{String(filteredBrands.length).padStart(2, '0')}</span> RESULTS</> : <><ArrowDownWideNarrow size={16} /> AFFINITY RANKED</>}</div></div>
            {hasSearched && <div className="results-filters">
              <label className="result-filter search-filter"><span>Search</span><span className="input-with-icon"><Search size={15} /><input value={resultSearch} onChange={(event) => { setResultSearch(event.target.value); setResultPage(0) }} placeholder={role === 'brand' ? 'Search creators' : 'Search brands'} /></span></label>
              {role === 'brand' && <>
                <label className="result-filter"><span>Creator type</span><select value={creatorType} onChange={(event) => { setCreatorType(event.target.value); setResultPage(0) }}><option value="both">All</option><option value="youtubers">YouTubers</option><option value="instagrammers">Instagrammers</option></select></label>
                <label className="result-filter"><span>Country</span><select value={countryFilter} onChange={(event) => { setCountryFilter(event.target.value); setResultPage(0) }}><option value="">All countries</option>{countries.map((country) => <option key={country} value={country}>{country}</option>)}</select></label>
                <label className="result-filter"><span>Gender</span><select value={genderFilter} onChange={(event) => { setGenderFilter(event.target.value); setResultPage(0) }}><option value="">Any gender</option><option value="female">Female</option><option value="male">Male</option><option value="non-binary">Non-binary</option></select></label>
              </>}
            </div>}
            {loading ? <div className="state-panel loading-state"><LoaderCircle className="spin" size={27} /><p>Reading your audience signals<span>Finding brands with a natural fit.</span></p></div>
              : error ? <div className="state-panel error-state"><CircleAlert size={24} /><h3>Couldn’t find matches</h3><p>{error}</p><span>Check the server’s Qloo configuration and try again.</span></div>
                : hasSearched && visibleBrands.length === 0 ? <div className="state-panel"><div className="empty-mark"><Search size={23} /></div><h3>No matches this time</h3><p>Try broadening your search or adjusting the filters.</p></div>
                  : hasSearched ? <div className="brand-list">{visibleBrands.map((brand, index) => role === 'brand'
                    ? <InfluencerCard key={brand.entity_id || brand.id || `${brand.name}-${index}`} person={brand} index={index} />
                    : <BrandCard key={brand.entity_id || brand.id || `${brand.name}-${index}`} brand={brand} index={index} />)}</div>
                    : <div className="results-empty"><div className="orbit-art" aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="orbit-core"><Sparkles size={23} /></span><span className="orbit-node node-one" /><span className="orbit-node node-two" /><span className="orbit-node node-three" /></div><span className="empty-overline">A BETTER KIND OF COLLABORATION</span><h3>Good partnerships<br />feel <em>inevitable.</em></h3><p>{role === 'brand' ? 'Add your product, creator style, and target audience to find people who match.' : 'Set your creator signals and we’ll surface brands with an audience affinity to match.'}</p><div className="signal-tags"><span><Users size={13} /> Audience</span><span><Building2 size={13} /> {role === 'brand' ? 'Creator fit' : 'Brand fit'}</span><span><MapPin size={13} /> Place</span></div></div>}
            {hasSearched && (filteredBrands.length > 0 || hasMoreResults) && <div className="results-pagination">
              <span>Page {visiblePage + 1} of {pageCount}{loadingMore ? ' · Loading more results…' : ''}</span>
              <div><button type="button" onClick={() => changeResultPage(visiblePage - 1)} disabled={visiblePage === 0 || loadingMore}>Previous</button><button type="button" onClick={() => changeResultPage(visiblePage + 1)} disabled={loadingMore || (visiblePage >= pageCount - 1 && !hasMoreResults)}>Next</button></div>
            </div>}
            {hasSearched && filteredBrands.length > 0 && <p className="results-footnote">Affinity scores reflect audience alignment, not a guarantee of partnership.</p>}
          </section>
        </div>
        </>}
      </main>
      <footer className="site-footer"><span>© 2026 SIGNAL STUDIO</span><span>BUILT FOR THE NEXT GOOD COLLABORATION <span className="footer-star">✳</span></span></footer>
    </div>
  )
}

export default App
