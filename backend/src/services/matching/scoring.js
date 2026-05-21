const BUDGET_TIERS = ['Under 10L', '10L-25L', '25L-50L', '50L-1Cr', '1Cr+']

const MATCH_WEIGHTS = {
  similarity: 0.30,
  geography: 0.20,
  budget: 0.15,
  pastImpact: 0.20,
  credibility: 0.15,
}

function tokenize(text) {
  if (!text) return new Set()
  return new Set(
    String(text).toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )
}

function jaccardSimilarity(a, b) {
  if (!a.size && !b.size) return 0
  let intersection = 0
  for (const token of a) {
    if (b.has(token)) intersection += 1
  }
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

function budgetTierIndex(range) {
  if (!range || range === 'All') return -1
  return BUDGET_TIERS.indexOf(range)
}

export function scoreBudgetFit(requestedRange, ngoRange) {
  const reqIdx = budgetTierIndex(requestedRange)
  const ngoIdx = budgetTierIndex(ngoRange)
  if (reqIdx < 0 || ngoIdx < 0) return 70
  const diff = Math.abs(reqIdx - ngoIdx)
  if (diff === 0) return 100
  if (diff === 1) return 70
  return 30
}

export function scoreDistrictFit(requestedDistrict, ngo) {
  if (!requestedDistrict) return 80

  const target = requestedDistrict.toLowerCase().replace(/,/g, ' ').trim()
  const districtsServed = (ngo.districtsServed || ngo.districts || []).map((d) =>
    String(d).toLowerCase().replace(/,/g, ' ').trim(),
  )

  if (districtsServed.some((d) => d === target || d.includes(target) || target.includes(d))) return 100
  if (districtsServed.some((d) => target.split(' ').some((w) => w.length > 3 && d.includes(w)))) return 75
  return 20
}

export function scoreGeography(requestedState, ngo, requestedDistrict) {
  const stateScore = scoreGeographyState(requestedState, ngo)
  if (!requestedDistrict) return stateScore
  const districtScore = scoreDistrictFit(requestedDistrict, ngo)
  return Math.round(districtScore * 0.7 + stateScore * 0.3)
}

function scoreGeographyState(requestedState, ngo) {
  if (!requestedState || requestedState === 'All') return 80

  const stateLower = requestedState.toLowerCase()
  const tagSlugs = ngo.tags || []
  const tagDetails = ngo.tagDetails || []

  if (tagSlugs.includes('pan-india')) return 50

  const geoMatch = tagDetails.some((t) =>
    t.metadata?.type === 'state' && (
      t.label?.toLowerCase() === stateLower
      || t.slug?.replace(/-/g, ' ') === stateLower
    ),
  )
  if (geoMatch) return 100

  const region = (ngo.region || '').toLowerCase()
  const statesServed = (ngo.statesServed || []).map((s) => s.toLowerCase())
  if (region === stateLower || statesServed.includes(stateLower)) return 100
  if (region.includes(stateLower) || statesServed.some((s) => s.includes(stateLower))) return 85

  return 0
}

export function scoreSimilarity(criteria, ngo) {
  const queryTokens = tokenize([
    criteria.csrFocus,
    criteria.keywords,
    criteria.theme && criteria.theme !== 'All' ? criteria.theme : '',
    criteria.impact && criteria.impact !== 'all' ? criteria.impact : '',
  ].filter(Boolean).join(' '))

  const ngoTokens = tokenize([
    ngo.description,
    ...(ngo.sectors || []),
    ...(ngo.focusAreas || []),
    ...(ngo.csrThemes || []),
    ...(ngo.tagDetails || []).map((t) => `${t.label} ${t.slug}`),
  ].join(' '))

  let textScore = jaccardSimilarity(queryTokens, ngoTokens) * 100

  let tagScore = 0
  let tagChecks = 0

  if (criteria.sdg && criteria.sdg !== 'all') {
    tagChecks += 1
    const sdgNum = parseInt(criteria.sdg, 10)
    if ((ngo.sdgs || []).includes(sdgNum)) tagScore += 100
  }

  if (criteria.theme && criteria.theme !== 'All') {
    tagChecks += 1
    const themeSlug = criteria.theme
    if ((ngo.tags || []).includes(themeSlug)) tagScore += 100
    else if ((ngo.csrThemes || []).some((t) => t.toLowerCase().includes(themeSlug.replace(/-/g, ' ')))) tagScore += 70
  }

  if (criteria.impact && criteria.impact !== 'all') {
    tagChecks += 1
    if ((ngo.tags || []).includes(criteria.impact)) tagScore += 100
  }

  const tagOverlap = tagChecks > 0 ? tagScore / tagChecks : 50
  return Math.round(textScore * 0.6 + tagOverlap * 0.4)
}

export function computeCredibilityScore(ngo) {
  let score = 0

  if (ngo.verified || ngo.verificationStatus === 'verified') score += 25

  const transparency = ngo.financialTransparency ?? 0
  score += (transparency / 100) * 35

  const rating = ngo.rating ?? 0
  score += (rating / 5) * 25

  const years = ngo.yearsActive ?? 0
  const beneficiaries = ngo.beneficiariesCount ?? 0
  const docCount = (ngo.documents || []).length
  const docProxy = Math.min(100, docCount * 15)
  const experienceProxy = Math.min(100, years * 5)
  const scaleProxy = Math.min(100, beneficiaries / 5000 * 100)
  score += ((experienceProxy + scaleProxy + docProxy) / 3 / 100) * 15

  return Math.round(Math.min(100, score))
}

export function scorePastImpact(ngo, performanceBySlug) {
  const perf = performanceBySlug.get(ngo.slug)
  if (perf != null) return Math.min(100, perf)

  const years = ngo.yearsActive ?? 0
  const beneficiaries = ngo.beneficiariesCount ?? 0
  const projects = ngo.projects ?? ngo.projectsCount ?? 0

  const experience = Math.min(100, years * 5)
  const scale = Math.min(100, beneficiaries / 10000 * 100)
  const portfolio = Math.min(100, projects * 10)

  return Math.round((experience + scale + portfolio) / 3)
}

export function buildGenericReason(breakdown) {
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1])
  const [topKey, topVal] = entries[0] || ['similarity', 0]
  const labels = {
    similarity: 'Strong alignment with your CSR focus and keywords',
    geography: 'Excellent geographic fit for your target state',
    budget: 'Budget range matches your allocation',
    pastImpact: 'Demonstrated track record and impact scale',
    credibility: 'High verification and transparency scores',
  }
  return `${labels[topKey] || 'Good overall fit'} (score: ${topVal}).`
}

export function scoreNgo(ngo, criteria, performanceBySlug) {
  const similarity = scoreSimilarity(criteria, ngo)
  const geography = scoreGeography(criteria.state, ngo, criteria.district)
  const budget = scoreBudgetFit(criteria.budgetRange, ngo.budgetRange)
  const pastImpact = scorePastImpact(ngo, performanceBySlug)
  const credibility = computeCredibilityScore(ngo)

  const matchPercent = Math.round(
    similarity * MATCH_WEIGHTS.similarity
    + geography * MATCH_WEIGHTS.geography
    + budget * MATCH_WEIGHTS.budget
    + pastImpact * MATCH_WEIGHTS.pastImpact
    + credibility * MATCH_WEIGHTS.credibility,
  )

  return {
    matchPercent: Math.min(100, Math.max(0, matchPercent)),
    credibilityScore: credibility,
    riskScore: ngo.riskScore ?? 0,
    scoreBreakdown: { similarity, geography, budget, pastImpact, credibility },
  }
}
