import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownWideNarrow, ArrowLeft, ArrowUpRight, AtSign, Building2, Check, CircleAlert, Copy, MapPin, Search, Sparkles, Users } from 'lucide-react'
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
  product: '', location: 'London', ageRanges: ['30_to_34'], creatorTags: ['urn:tag:genre:person:influencer'], gender: 'any', popularityTier: 2,
}
const outreachDeliverables = {
  Reel: '1 Instagram Reel showcasing [product name] in your style',
  Story: '1 Instagram Story set (with direct link sticker)',
  Post: '1 Feed Carousel / Post highlighting your honest thoughts',
  'Live mention': 'a brief mention/shoutout during your next Instagram Live stream',
}
const initialOutreachForm = {
  brandName: '',
  productName: '',
  nicheTopic: '',
  senderName: '',
  objective: 'awareness',
  partnership: 'gifting',
  deliverables: ['Reel', 'Story'],
  compensation: 'fixed',
  kitName: '',
  kitValue: '',
  productList: '',
  fixedFeeAmount: '',
  discountPercent: '',
  commissionPercent: '',
  callToAction: 'inbound',
  brandEmail: '',
  brandPhone: '',
}

function buildOutreachMessage(details) {
  const brandName = details.brandName.trim() || '[brand name]'
  const productName = details.productName.trim() || '[product name]'
  const objectiveHooks = {
    awareness: `We’ve been loving your content and visual style. We’re currently introducing ${brandName} to more people who love ${details.nicheTopic.trim() || '[niche topic]'}, and your profile immediately stood out to us!`,
    launch: `We are dropping our brand-new ${productName} very soon, and we’re putting together an exclusive group of creators to feature it first!`,
    sale: `We’re launching an exclusive promotion for ${brandName} and wanted to give your community early access to special savings on ${productName}.`,
    generic: `Reaching out from ${brandName}—we really admire your content and would love to explore a potential collaboration with you.`,
  }
  const partnershipIntros = {
    gifting: 'We’d love to send over a complimentary PR package for you to try out',
    paid: 'We’d love to partner with you on a sponsored campaign',
    affiliate: 'We’d love to invite you to join our partner program and share exclusive perks with your audience',
    ambassador: `We are looking for long-term brand ambassadors to represent ${brandName}, and we think you’d be a perfect fit`,
  }
  const selectedDeliverables = details.deliverables
    .map((deliverable) => outreachDeliverables[deliverable]?.replace('[product name]', productName))
    .filter(Boolean)
  const partnershipSection = selectedDeliverables.length
    ? `${partnershipIntros[details.partnership]}, featuring ${selectedDeliverables.join(' and ')}.`
    : `${partnershipIntros[details.partnership]}.`
  const compensationSection = details.partnership === 'gifting'
    ? `In exchange, we’d send you our exclusive ${details.kitName.trim() || '[kit name]'} PR kit (valued at ${details.kitValue.trim() || '[kit value]'}) containing ${details.productList.trim() || '[product list]'}.`
    : details.partnership === 'affiliate'
      ? `We’ll set you up with a unique ${details.discountPercent.trim() || '[discount percent]'}% discount code for your followers, plus a ${details.commissionPercent.trim() || '[commission percent]'}% commission on every sale generated through your code/link.`
      : details.compensation === 'fixed'
      ? `We have a fixed budget of ${details.fixedFeeAmount.trim() || '[fixed fee amount]'} set aside for this collaboration.`
        : 'We’d love to hear your standard rates for this deliverable package.'
  const brandContacts = [
    details.brandEmail.trim() || '[brand email]',
    details.brandPhone.trim() || '[brand phone]',
  ]
  const sections = [
    `Hi [creator name],`,
    objectiveHooks[details.objective],
    partnershipSection,
    compensationSection,
    details.callToAction === 'inbound'
      ? `If you're interested, feel free to reach out to us directly at ${brandContacts[0]} or call/WhatsApp us at ${brandContacts[1]} so we can share the complete brief!`
      : details.callToAction === 'outbound'
        ? 'If this sounds like a fit, please share your preferred email address or phone number and we’ll send over the complete brief and details!'
        : 'Let us know if you’re interested by replying right here in DM, and we can take it from there!',
    `Talk soon!\n${details.senderName.trim() || '[your name]'}\n${brandName}`,
  ]

  return sections.join('\n\n')
}

function getOutreachHighlightTerms(details) {
  return [
    details.brandName,
    details.productName,
    details.nicheTopic,
    details.senderName,
    details.kitName,
    details.kitValue,
    details.productList,
    details.fixedFeeAmount,
    details.discountPercent && `${details.discountPercent}%`,
    details.commissionPercent && `${details.commissionPercent}%`,
    details.brandEmail,
    details.brandPhone,
  ].filter((term) => typeof term === 'string' && term.trim()).map((term) => term.trim())
}

function OutreachMessageEditor({ value, onChange, highlightTerms }) {
  const textareaRef = useRef(null)
  const escapedTerms = useMemo(
    () => [...new Set(highlightTerms)].sort((first, second) => second.length - first.length).map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    [highlightTerms],
  )
  const highlightedMessage = useMemo(() => {
    const matcher = new RegExp(`(\\[[^\\]\\n]+\\]${escapedTerms.length ? `|${escapedTerms.join('|')}` : ''})`, 'gi')
    return value.split(matcher).map((part, index) => (
      /^\[[^\]\n]+\]$/.test(part)
        ? <span className="outreach-unfilled-value" key={`${part}-${index}`}>{part}</span>
        : escapedTerms.some((term) => new RegExp(`^${term}$`, 'i').test(part))
        ? <span className="outreach-dynamic-value" key={`${part}-${index}`}>{part}</span>
        : part
    ))
  }, [escapedTerms, value])

  function syncScroll(event) {
    if (textareaRef.current) {
      textareaRef.current.previousElementSibling.scrollTop = event.currentTarget.scrollTop
      textareaRef.current.previousElementSibling.scrollLeft = event.currentTarget.scrollLeft
    }
  }

  return (
    <div className="outreach-editor">
      <div className="outreach-highlight-layer" aria-hidden="true">{highlightedMessage}{value.endsWith('\n') ? ' ' : ''}</div>
      <textarea
        ref={textareaRef}
        id="outreach-message"
        className="outreach-message"
        value={value}
        onChange={onChange}
        onScroll={syncScroll}
        spellCheck="false"
      />
    </div>
  )
}

function getInfluencerKey(person) {
  return person.entity_id || person.id || person.name
}

function readOutreachInfluencers() {
  if (window.location.hash !== '#outreach') return []

  try {
    const influencers = JSON.parse(sessionStorage.getItem('outreachInfluencers') || '[]')
    return Array.isArray(influencers) ? influencers : []
  } catch (error) {
    console.error('Could not restore selected influencers:', error)
    return []
  }
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

async function getInstagramActivity(username) {
  const response = await fetch('/api/influencers/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username] }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Instagram details request failed (${response.status})`)
  const metrics = data.metrics?.[username]
  if (!metrics) throw new Error(`No Instagram details were returned for @${username}.`)
  return metrics
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
      if (!['http:', 'https:'].includes(url.protocol)) return null
      if (platform === 'instagram'
        && !['instagram.com', 'www.instagram.com'].includes(url.hostname.toLowerCase())) return null
      return url.href
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

function getInstagramUsername(person) {
  const entry = person?.external?.instagram_username || person?.external?.instagram
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
      if (!['instagram.com', 'www.instagram.com'].includes(url.hostname.toLowerCase())) return null
      return url.pathname.split('/').filter(Boolean)[0] || null
    } catch {
      return null
    }
  }

  if (!/^[A-Za-z0-9._]+$/.test(normalized) || /^(accounts|about|developer|direct|explore|legal|p|reel|reels|stories)$/i.test(normalized)) {
    return null
  }
  return normalized
}

function InfluencerCard({ person, index, selected = false, onToggle, selectable = true, onCopy, copied = false, activityEnabled = true, activityStatus = 'idle', activityError = '', onFetchActivity }) {
  const name = person.name || 'Unknown creator'
  const affinity = Number(person.query?.affinity ?? 0)
  const properties = person.properties || {}
  const imageUrl = properties.image?.url || person.image?.url
  const description = getShortDescription(properties.short_descriptions)
  const instagramUrl = getSocialUrl(person.external?.instagram_username || person.external?.instagram, 'instagram')
  const instagramFollowerLabel = Number.isFinite(person.instagramFollowers)
    ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(person.instagramFollowers)
    : 'Unavailable'
  const engagementRateLabel = Number.isFinite(person.instagramEngagementRate)
    ? `${person.instagramEngagementRate.toFixed(2)}%`
    : 'Unavailable'
  const engagementPostCount = Number(person.instagramEngagementPostCount) || 0

  return (
    <article className={`brand-card influencer-card${selected ? ' is-selected' : ''}`} style={{ '--card-index': index }}>
      <button
        className="creator-card-select"
        type="button"
        aria-pressed={selected}
        onClick={selectable ? onToggle : undefined}
        disabled={!selectable}
        aria-label={`${selected ? 'Deselect' : 'Select'} ${name}`}
      >
        <header className="creator-card-header">
          <div className="creator-card-heading">
            <h3 className="creator-card-name">{name}</h3>
            <p className="creator-card-description">{description || 'Creator profile'}</p>
          </div>
          <div className="creator-card-actions">
            <span className="creator-affinity"><strong>{Math.round(affinity * 100)}%</strong><small>Affinity</small></span>
            {selectable && <span className="creator-card-check" aria-hidden="true">{selected ? '✓' : '+'}</span>}
          </div>
        </header>
        <div className={`creator-card-photo mark-${index % 5}`}>
          {imageUrl ? <img src={imageUrl} alt={`${name} profile`} /> : <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>}
        </div>
      </button>
      <footer className="creator-card-metrics">
        {!activityEnabled
          ? <>
            <div className="creator-card-metric"><span>FOLLOWERS</span><strong>{instagramFollowerLabel}</strong></div>
            <div className="creator-card-metric"><span>MEDIAN ENGAGEMENT</span><strong>{engagementRateLabel}</strong><small>{engagementPostCount ? `Latest ${engagementPostCount} of 6 posts` : 'Post data unavailable'}</small></div>
          </>
          : activityStatus === 'loading'
          ? <div className="creator-card-activity-loading" role="status"><span className="creator-activity-spinner" aria-hidden="true" />Fetching Instagram details</div>
          : activityStatus === 'success'
            ? <>
              <div className="creator-card-metric"><span>FOLLOWERS</span><strong>{instagramFollowerLabel}</strong></div>
              <div className="creator-card-metric"><span>MEDIAN ENGAGEMENT</span><strong>{engagementRateLabel}</strong><small>{engagementPostCount ? `Latest ${engagementPostCount} of 6 posts` : 'Post data unavailable'}</small></div>
              <button className="creator-fetch-details" type="button" onClick={() => onFetchActivity(person)}>Refresh Instagram details</button>
            </>
            : <>
              {activityStatus === 'error' && <p className="creator-card-activity-error" role="alert">{activityError}</p>}
              {instagramUrl
                ? <button className="creator-fetch-details" type="button" onClick={() => onFetchActivity(person)}>
                  Fetch Instagram details
                </button>
                : <p className="creator-card-activity-unavailable">Instagram username unavailable</p>}
            </>}
      </footer>
      {instagramUrl && <a className="creator-instagram-link" href={instagramUrl} target="_blank" rel="noreferrer" aria-label={`${name} on Instagram`} title="Open Instagram profile"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle className="instagram-icon-dot" cx="17.5" cy="6.8" r="1" /></svg></a>}
      {onCopy && <button className="creator-copy-button" type="button" onClick={() => onCopy(person)} aria-label={`Copy outreach message for ${name}`} title={`Copy message for ${name}`}>
        {copied ? <Check size={17} /> : <Copy size={17} />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>}
    </article>
  )
}

function App() {
  const [isOutreachPage, setIsOutreachPage] = useState(() => window.location.hash === '#outreach')
  const [outreachInfluencers, setOutreachInfluencers] = useState(readOutreachInfluencers)
  const [outreachDraft, setOutreachDraft] = useState(() => ({
    form: initialOutreachForm,
    message: buildOutreachMessage(initialOutreachForm),
  }))
  const [copiedCreator, setCopiedCreator] = useState('')
  const [copyError, setCopyError] = useState('')
  const [selectedInfluencers, setSelectedInfluencers] = useState([])
  const [role, setRole] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [influencerForm, setInfluencerForm] = useState(initialInfluencerForm)
  const [brands, setBrands] = useState([])
  const [resultPage, setResultPage] = useState(0)
  const [nextApiPage, setNextApiPage] = useState(2)
  const [hasMoreResults, setHasMoreResults] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [instagramActivityStatuses, setInstagramActivityStatuses] = useState({})
  const [resultSearch, setResultSearch] = useState('')
  const [creatorSort, setCreatorSort] = useState('affinity')
  const [countryFilter, setCountryFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [error, setError] = useState('')
  const activeInstagramUsernames = useRef(new Set())
  const instagramRequestQueue = useRef(Promise.resolve())
  const instagramSearchGeneration = useRef(0)
  const loadingMessages = role === 'brand'
    ? ['Sending query to Qloo API', 'Finding influencers with a natural fit', 'Preparing your creator matches']
    : ['Sending query to Qloo API', 'Finding brands with a natural fit', 'Preparing your matches']

  useEffect(() => {
    function updateOutreachRoute() {
      setIsOutreachPage(window.location.hash === '#outreach')
      if (window.location.hash === '#outreach') setOutreachInfluencers(readOutreachInfluencers())
    }
    window.addEventListener('hashchange', updateOutreachRoute)
    return () => window.removeEventListener('hashchange', updateOutreachRoute)
  }, [])

  useEffect(() => {
    if (!loading) return undefined

    const interval = window.setInterval(() => {
      setLoadingMessageIndex((current) => (current + 1) % loadingMessages.length)
    }, 2800)
    return () => window.clearInterval(interval)
  }, [loading, loadingMessages.length, role])

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

  function toggleInfluencerSelection(person) {
    const key = getInfluencerKey(person)
    setSelectedInfluencers((current) => current.some((selected) => getInfluencerKey(selected) === key)
      ? current.filter((selected) => getInfluencerKey(selected) !== key)
      : [...current, person])
  }

  function removeSelectedInfluencer(person) {
    const key = getInfluencerKey(person)
    setSelectedInfluencers((current) => current.filter((selected) => getInfluencerKey(selected) !== key))
  }

  function updateOutreachField(event) {
    const { name, value } = event.target
    setOutreachDraft((current) => {
      const form = { ...current.form, [name]: value }
      if (name === 'partnership') {
        form.compensation = value === 'gifting' ? 'gifting' : value === 'affiliate' ? 'affiliate' : 'fixed'
      }
      return { form, message: buildOutreachMessage(form) }
    })
  }

  function toggleOutreachDeliverable(deliverable) {
    setOutreachDraft((current) => {
      const form = {
        ...current.form,
        deliverables: current.form.deliverables.includes(deliverable)
          ? current.form.deliverables.filter((item) => item !== deliverable)
          : [...current.form.deliverables, deliverable],
      }
      return { form, message: buildOutreachMessage(form) }
    })
  }

  async function copyOutreachMessage(person) {
    const name = person.name || 'creator'
    const personalizedMessage = outreachDraft.message.replace(/\[creator name\]/gi, name)
    try {
      await navigator.clipboard.writeText(personalizedMessage)
      setCopiedCreator(getInfluencerKey(person))
      setCopyError('')
      window.setTimeout(() => setCopiedCreator(''), 1800)
    } catch (clipboardError) {
      console.error('Could not copy outreach message:', clipboardError)
      setCopyError('Could not copy the message. Check your browser clipboard permissions and try again.')
    }
  }

  function beginOutreach() {
    try {
      sessionStorage.setItem('outreachInfluencers', JSON.stringify(selectedInfluencers))
      setOutreachInfluencers(selectedInfluencers)
      setIsOutreachPage(true)
      window.location.hash = 'outreach'
    } catch (storageError) {
      console.error('Could not save selected influencers for outreach:', storageError)
      setError('Could not open the outreach page. Check that browser storage is available and try again.')
    }
  }

  function fetchInstagramDetails(person) {
    const username = getInstagramUsername(person)
    if (!username) return

    const generation = instagramSearchGeneration.current
    const requestKey = `${generation}:${username}`
    if (activeInstagramUsernames.current.has(requestKey)) return

    activeInstagramUsernames.current.add(requestKey)
    setInstagramActivityStatuses((current) => ({
      ...current,
      [username]: { status: 'loading', error: '' },
    }))
    instagramRequestQueue.current = instagramRequestQueue.current.then(async () => {
      try {
        if (generation !== instagramSearchGeneration.current) return

        const metrics = await getInstagramActivity(username)
        if (generation !== instagramSearchGeneration.current) return

        const normalizedMetrics = {
          instagramFollowers: metrics.followers,
          instagramEngagementRate: metrics.engagementRate,
          instagramEngagementPostCount: metrics.engagementPostCount,
        }
        const applyMetrics = (creator) => getInstagramUsername(creator) === username
          ? { ...creator, ...normalizedMetrics }
          : creator
        setBrands((current) => current.map(applyMetrics))
        setSelectedInfluencers((current) => current.map(applyMetrics))
        setInstagramActivityStatuses((current) => ({
          ...current,
          [username]: { status: 'success', error: '' },
        }))
      } catch (requestError) {
        console.error(`Could not fetch Instagram details for @${username}:`, requestError)
        if (generation === instagramSearchGeneration.current) {
          setInstagramActivityStatuses((current) => ({
            ...current,
            [username]: {
              status: 'error',
              error: requestError.message || 'Could not fetch Instagram details.',
            },
          }))
        }
      } finally {
        activeInstagramUsernames.current.delete(requestKey)
      }
    })
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
    setLoadingMessageIndex(0)
    setLoading(true)
    setError('')
    instagramSearchGeneration.current += 1
    setInstagramActivityStatuses({})
    try {
      const isBrand = role === 'brand'
      const request = isBrand
        ? { ...influencerForm, popularityTier: Number(influencerForm.popularityTier), page: 1 }
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
    instagramSearchGeneration.current += 1
    setInstagramActivityStatuses({})
    setRole(nextRole)
    setBrands([])
    setSelectedInfluencers([])
    setHasSearched(false)
    setError('')
    setResultPage(0)
    setNextApiPage(2)
    setHasMoreResults(false)
    setResultSearch('')
    setCreatorSort('affinity')
    setCountryFilter('')
    setGenderFilter('')
  }

  const outreachForm = outreachDraft.form
  const outreachMessage = outreachDraft.message
  const outreachHighlightTerms = getOutreachHighlightTerms(outreachForm)
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
    return (!query || searchableText.includes(query))
      && (!countryFilter || citizenship.includes(countryFilter))
      && (!genderFilter || genders.some((gender) => typeof gender === 'string' && gender.toLowerCase() === genderFilter))
  }).sort((first, second) => {
    if (creatorSort === 'affinity') {
      return Number(second.query?.affinity ?? 0) - Number(first.query?.affinity ?? 0)
    }
    const [metric, direction] = creatorSort.split('-')
    const value = (item) => metric === 'followers'
      ? item.instagramFollowers
      : item.instagramEngagementRate
    const firstValue = value(first)
    const secondValue = value(second)
    const firstAvailable = Number.isFinite(firstValue)
    const secondAvailable = Number.isFinite(secondValue)
    if (firstAvailable !== secondAvailable) return firstAvailable ? -1 : 1
    if (!firstAvailable) return Number(second.query?.affinity ?? 0) - Number(first.query?.affinity ?? 0)
    const difference = direction === 'asc' ? firstValue - secondValue : secondValue - firstValue
    return difference || Number(second.query?.affinity ?? 0) - Number(first.query?.affinity ?? 0)
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
            ? { ...influencerForm, popularityTier: Number(influencerForm.popularityTier), page }
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

  if (isOutreachPage) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <a className="wordmark" href="#top" aria-label="Signal home"><span className="wordmark-icon"><Sparkles size={16} /></span><span>signal<span className="wordmark-period">.</span></span></a>
          <div className="topbar-note"><span className="status-dot" /> CREATOR INTELLIGENCE <span className="topbar-divider">/</span> OUTREACH STUDIO</div>
          <a className="topbar-link" href="#"><ArrowLeft size={14} /> Back to shortlist</a>
        </header>
        <main className="outreach-page">
          <section className="outreach-intro">
            <div className="eyebrow"><span>02</span> THE OUTREACH STUDIO</div>
            <h1>Make it <em>personal.</em></h1>
            <p>Shape your campaign, refine the message, and reach out to your shortlisted creators.</p>
          </section>
          <div className="outreach-workspace">
            <section className="outreach-brief" aria-labelledby="outreach-brief-title">
              <div className="outreach-section-heading"><span className="section-kicker">01 / CAMPAIGN DETAILS</span><h2 id="outreach-brief-title">Your brief</h2></div>
              <div className="outreach-form">
                <fieldset className="outreach-filter-block">
                  <legend><span>01</span> Marketing objective</legend>
                  <label className="field"><span>Objective</span><select name="objective" value={outreachForm.objective} onChange={updateOutreachField}><option value="awareness">Brand awareness</option><option value="launch">Product launch</option><option value="sale">Sale / performance</option><option value="generic">Generic</option></select></label>
                  <label className="field"><span>Brand name</span><input name="brandName" value={outreachForm.brandName} onChange={updateOutreachField} placeholder="e.g. Good Ground" /></label>
                  <label className="field"><span>Product or collection</span><input name="productName" value={outreachForm.productName} onChange={updateOutreachField} placeholder="e.g. Daily essentials" /></label>
                  {outreachForm.objective === 'awareness' && <label className="field"><span>Niche topic</span><input name="nicheTopic" value={outreachForm.nicheTopic} onChange={updateOutreachField} placeholder="e.g. sustainable skincare" /></label>}
                  <label className="field"><span>Your name</span><input name="senderName" value={outreachForm.senderName} onChange={updateOutreachField} placeholder="e.g. Alex" /></label>
                </fieldset>
                <fieldset className="outreach-filter-block">
                  <legend><span>02</span> Deliverables</legend>
                  <div className="outreach-deliverables">
                    <div className="creator-tag-options">{['Reel', 'Story', 'Post', 'Live mention'].map((deliverable) => <button className={`creator-tag${outreachForm.deliverables.includes(deliverable) ? ' is-selected' : ''}`} key={deliverable} type="button" aria-pressed={outreachForm.deliverables.includes(deliverable)} onClick={() => toggleOutreachDeliverable(deliverable)}>{deliverable}</button>)}</div>
                  </div>
                </fieldset>
                <fieldset className="outreach-filter-block">
                  <legend><span>03</span> Budget</legend>
                  <label className="field"><span>Partnership type</span><select name="partnership" value={outreachForm.partnership} onChange={updateOutreachField}><option value="gifting">Gifting</option><option value="paid">Paid collaboration</option><option value="affiliate">Affiliate</option><option value="ambassador">Ambassador</option></select></label>
                  {outreachForm.partnership === 'gifting' && <>
                    <label className="field"><span>Kit name</span><input name="kitName" value={outreachForm.kitName} onChange={updateOutreachField} placeholder="e.g. The Daily Ritual Kit" /></label>
                    <label className="field"><span>Kit value</span><input name="kitValue" value={outreachForm.kitValue} onChange={updateOutreachField} placeholder="e.g. $120" /></label>
                    <label className="field"><span>Products in the kit</span><input name="productList" value={outreachForm.productList} onChange={updateOutreachField} placeholder="e.g. cleanser, serum, moisturizer" /></label>
                  </>}
                  {outreachForm.partnership === 'affiliate' && <>
                    <label className="field"><span>Follower discount (%)</span><input name="discountPercent" value={outreachForm.discountPercent} onChange={updateOutreachField} placeholder="e.g. 15" inputMode="decimal" /></label>
                    <label className="field"><span>Creator commission (%)</span><input name="commissionPercent" value={outreachForm.commissionPercent} onChange={updateOutreachField} placeholder="e.g. 10" inputMode="decimal" /></label>
                  </>}
                  {['paid', 'ambassador'].includes(outreachForm.partnership) && <>
                    <label className="field"><span>Compensation approach</span><select name="compensation" value={outreachForm.compensation} onChange={updateOutreachField}><option value="fixed">Fixed fee</option><option value="ask">Ask for creator’s rates</option></select></label>
                    {outreachForm.compensation === 'fixed' && <label className="field"><span>Fixed fee</span><input name="fixedFeeAmount" value={outreachForm.fixedFeeAmount} onChange={updateOutreachField} placeholder="e.g. $500" /></label>}
                  </>}
                </fieldset>
                <fieldset className="outreach-filter-block">
                  <legend><span>04</span> Call to action</legend>
                  <label className="field"><span>How should they respond?</span><select name="callToAction" value={outreachForm.callToAction} onChange={updateOutreachField}><option value="inbound">Contact us directly</option><option value="outbound">Ask for creator’s email / phone</option><option value="instagram">Reply to Instagram message</option></select></label>
                  {outreachForm.callToAction === 'inbound' && <>
                    <label className="field"><span>Brand email</span><input name="brandEmail" type="email" value={outreachForm.brandEmail} onChange={updateOutreachField} placeholder="e.g. hello@brand.com" /></label>
                    <label className="field"><span>Brand phone / WhatsApp</span><input name="brandPhone" type="tel" value={outreachForm.brandPhone} onChange={updateOutreachField} placeholder="e.g. +1 555 0100" /></label>
                  </>}
                </fieldset>
              </div>
            </section>
            <section className="outreach-composer" aria-labelledby="outreach-message-title">
              <div className="outreach-section-heading"><span className="section-kicker">02 / MESSAGE TEMPLATE</span><h2 id="outreach-message-title">Your outreach</h2></div>
              <p className="outreach-helper">A modular draft tailored to your brief. Edit anything before copying.</p>
              <label className="outreach-message-label" htmlFor="outreach-message">Email message</label>
              <OutreachMessageEditor
                value={outreachMessage}
                highlightTerms={outreachHighlightTerms}
                onChange={(event) => setOutreachDraft((current) => ({ ...current, message: event.target.value }))}
              />
              <p className="outreach-token-note">Personalized tags like <code>[creator name]</code> are filled in when you copy a creator’s message.</p>
            </section>
            <aside className="outreach-creators" aria-labelledby="outreach-creators-title">
              <div className="outreach-section-heading"><span className="section-kicker">03 / YOUR SHORTLIST</span><h2 id="outreach-creators-title">Creators <span>{outreachInfluencers.length}</span></h2></div>
              {copyError && <p className="outreach-copy-error" role="alert">{copyError}</p>}
              {outreachInfluencers.length > 0
                ? <div className="outreach-cards-grid">{outreachInfluencers.map((person, index) => <InfluencerCard key={getInfluencerKey(person) || index} person={person} index={index} selectable={false} activityEnabled={false} onCopy={copyOutreachMessage} copied={copiedCreator === getInfluencerKey(person)} />)}</div>
                : <div className="outreach-empty"><Users size={20} /><p>No creators in your shortlist yet.</p><a href="#">Return to creator search</a></div>}
            </aside>
          </div>
        </main>
        <footer className="site-footer"><span>© 2026 SIGNAL STUDIO</span><span>BUILT FOR THE NEXT GOOD COLLABORATION <span className="footer-star">✳</span></span></footer>
      </div>
    )
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
              <button className="submit-button" type="submit" disabled={loading}>{loading ? <><span className="button-loading-bar" aria-hidden="true" /> Finding matches</> : <><Search size={17} /> Find {role === 'brand' ? 'influencers' : 'brand matches'} <ArrowUpRight size={16} /></>}</button>
              <p className="privacy-note">Your brief stays private. Only matching signals are sent to Qloo.</p>
            </form>
          </aside>
          <section className="results-panel" aria-live="polite">
            <div className="results-heading"><div><span className="section-kicker">THE SHORTLIST</span><h2 className={!hasSearched ? 'preserve-font-size' : ''}>{hasSearched ? (role === 'brand' ? 'Your influencer matches' : 'Your brand matches') : 'Made for your signal'}</h2></div><div className="results-count">{hasSearched && !error ? <><span>{String(filteredBrands.length).padStart(2, '0')}</span> RESULTS</> : <><ArrowDownWideNarrow size={16} /> AFFINITY RANKED</>}</div></div>
            {hasSearched && <div className={`results-filters${role === 'brand' ? ' creator-results-filters' : ''}`}>
              <label className="result-filter search-filter"><span>Search</span><span className="input-with-icon"><Search size={15} /><input value={resultSearch} onChange={(event) => { setResultSearch(event.target.value); setResultPage(0) }} placeholder={role === 'brand' ? 'Search creators' : 'Search brands'} /></span></label>
              {role === 'brand' && <>
                <label className="result-filter"><span>Country</span><select value={countryFilter} onChange={(event) => { setCountryFilter(event.target.value); setResultPage(0) }}><option value="">All countries</option>{countries.map((country) => <option key={country} value={country}>{country}</option>)}</select></label>
                <label className="result-filter"><span>Gender</span><select value={genderFilter} onChange={(event) => { setGenderFilter(event.target.value); setResultPage(0) }}><option value="">Any gender</option><option value="female">Female</option><option value="male">Male</option><option value="non-binary">Non-binary</option></select></label>
                <label className="result-filter"><span>Sort by</span><select value={creatorSort} onChange={(event) => { setCreatorSort(event.target.value); setResultPage(0) }}><option value="affinity">Affinity</option><option value="followers-desc">Followers: high to low</option><option value="followers-asc">Followers: low to high</option><option value="engagement-desc">Engagement: high to low</option><option value="engagement-asc">Engagement: low to high</option></select></label>
              </>}
            </div>}
            {loading ? <div className="state-panel loading-state">
              <div className="loading-progress" role="progressbar" aria-label="Search in progress" aria-valuetext={loadingMessages[loadingMessageIndex]}><span /></div>
              <p aria-live="polite">{loadingMessages[loadingMessageIndex]}<span>Usually takes a few moments.</span></p>
            </div>
              : error ? <div className="state-panel error-state"><CircleAlert size={24} /><h3>Couldn’t find matches</h3><p>{error}</p><span>Check the server’s Qloo configuration and try again.</span></div>
                : hasSearched && visibleBrands.length === 0 ? <div className="state-panel"><div className="empty-mark"><Search size={23} /></div><h3>No matches this time</h3><p>Try broadening your search or adjusting the filters.</p></div>
                  : hasSearched ? <div className={`brand-list${role === 'brand' ? ' influencer-results-grid' : ''}`}>{visibleBrands.map((brand, index) => role === 'brand'
                    ? <InfluencerCard
                      key={getInfluencerKey(brand) || index}
                      person={brand}
                      index={index}
                      selected={selectedInfluencers.some((selected) => getInfluencerKey(selected) === getInfluencerKey(brand))}
                      onToggle={() => toggleInfluencerSelection(brand)}
                      activityStatus={instagramActivityStatuses[getInstagramUsername(brand)]?.status}
                      activityError={instagramActivityStatuses[getInstagramUsername(brand)]?.error}
                      onFetchActivity={fetchInstagramDetails}
                    />
                    : <BrandCard key={brand.entity_id || brand.id || `${brand.name}-${index}`} brand={brand} index={index} />)}</div>
                    : <div className="results-empty"><div className="orbit-art" aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="orbit-core"><Sparkles size={23} /></span><span className="orbit-node node-one" /><span className="orbit-node node-two" /><span className="orbit-node node-three" /></div><span className="empty-overline">A BETTER KIND OF COLLABORATION</span><h3>Good partnerships<br />feel <em>inevitable.</em></h3><p>{role === 'brand' ? 'Add your product, creator style, and target audience to find people who match.' : 'Set your creator signals and we’ll surface brands with an audience affinity to match.'}</p><div className="signal-tags"><span><Users size={13} /> Audience</span><span><Building2 size={13} /> {role === 'brand' ? 'Creator fit' : 'Brand fit'}</span><span><MapPin size={13} /> Place</span></div></div>}
            {hasSearched && (filteredBrands.length > 0 || hasMoreResults) && <div className="results-pagination">
              <span>Page {visiblePage + 1} of {pageCount}{loadingMore ? ' · Loading more results…' : ''}</span>
              <div><button type="button" onClick={() => changeResultPage(visiblePage - 1)} disabled={visiblePage === 0 || loadingMore}>Previous</button><button type="button" onClick={() => changeResultPage(visiblePage + 1)} disabled={loadingMore || (visiblePage >= pageCount - 1 && !hasMoreResults)}>Next</button></div>
            </div>}
            {hasSearched && filteredBrands.length > 0 && <p className="results-footnote">Affinity scores reflect audience alignment, not a guarantee of partnership.</p>}
          </section>
        </div>
        {role === 'brand' && selectedInfluencers.length > 0 && <aside className="outreach-cart" aria-label="Selected influencers">
          <div className="outreach-cart-heading">
            <div><span className="section-kicker">OUTREACH LIST</span><h2>Selected creators</h2></div>
            <span className="outreach-cart-count">{selectedInfluencers.length}</span>
          </div>
          <ul className="outreach-cart-list">
            {selectedInfluencers.map((person) => (
              <li key={getInfluencerKey(person)}>
                <span>{person.name || 'Unknown creator'}</span>
                <button type="button" onClick={() => removeSelectedInfluencer(person)} aria-label={`Remove ${person.name || 'creator'} from outreach list`}>Remove</button>
              </li>
            ))}
          </ul>
          <button className="outreach-begin-button" type="button" onClick={beginOutreach}>Begin outreach <ArrowUpRight size={16} /></button>
        </aside>}
        </>}
      </main>
      <footer className="site-footer"><span>© 2026 SIGNAL STUDIO</span><span>BUILT FOR THE NEXT GOOD COLLABORATION <span className="footer-star">✳</span></span></footer>
    </div>
  )
}

export default App
