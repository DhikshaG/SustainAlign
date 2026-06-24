import { api } from './api'
import { discoveryFilters as fallbackFilters } from '../data/corporate/ngos'

const PAGE_SIZE = 20

function buildQuery(params) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '' && v !== 'All' && v !== 'all') qs.set(k, v)
  }
  return qs.toString()
}

export { PAGE_SIZE }

export async function fetchDiscoveryFilters() {
  try {
    const res = await api.get('/api/corporate/discovery/filters')
    return res.data
  } catch {
    return {
      states: fallbackFilters.locations.map((l) => ({ value: l, label: l === 'All' ? 'All states' : l })),
      sdgs: fallbackFilters.sdgs,
      themes: fallbackFilters.csrThemes.map((t) => ({ value: t === 'All' ? 'All' : t.toLowerCase().replace(/\s+/g, '-'), label: t })),
      impactAreas: [
        { value: 'all', label: 'All impact areas' },
        { value: 'climate', label: 'Climate' },
        { value: 'water-sanitation', label: 'Water & Sanitation' },
        { value: 'livelihood', label: 'Livelihood' },
        { value: 'child-welfare', label: 'Child welfare' },
      ],
      budgetRanges: fallbackFilters.budgetRanges.map((b) => ({ value: b, label: b === 'All' ? 'All budgets' : b })),
      verifiedOptions: [
        { value: 'all', label: 'All NGOs' },
        { value: 'true', label: 'Verified only' },
      ],
    }
  }
}

export async function fetchDiscoveryNgos(params = {}) {
  const q = buildQuery(params)
  const res = await api.get(`/api/corporate/discovery/ngos${q ? `?${q}` : ''}`)
  return {
    ngos: res.data?.ngos ?? [],
    total: res.data?.total ?? 0,
    limit: res.data?.limit ?? PAGE_SIZE,
    offset: res.data?.offset ?? 0,
  }
}

export async function fetchSavedNgos() {
  const res = await api.get('/api/corporate/saved-ngos')
  return {
    ngos: res.data?.ngos ?? [],
    slugs: res.data?.slugs ?? [],
  }
}

export async function saveNgo(slug) {
  const res = await api.post(`/api/corporate/saved-ngos/${slug}`)
  return res.data
}

export async function unsaveNgo(slug) {
  const res = await api.delete(`/api/corporate/saved-ngos/${slug}`)
  return res.data
}

export async function contactNgo(slug, { subject, message }) {
  const res = await api.post(`/api/corporate/ngos/${slug}/contact`, { subject, message })
  return res.data
}

export function filtersToSearchParams(filters) {
  const p = new URLSearchParams()
  if (filters.mode === 'match') p.set('mode', 'match')
  if (filters.csrFocus) p.set('csrFocus', filters.csrFocus)
  if (filters.keywords) p.set('keywords', filters.keywords)
  if (filters.q) p.set('q', filters.q)
  if (filters.state && filters.state !== 'All') p.set('state', filters.state)
  if (filters.sdg && filters.sdg !== 'all') p.set('sdg', filters.sdg)
  if (filters.theme && filters.theme !== 'All') p.set('theme', filters.theme)
  if (filters.impact && filters.impact !== 'all') p.set('impact', filters.impact)
  if (filters.budgetRange && filters.budgetRange !== 'All') p.set('budgetRange', filters.budgetRange)
  if (filters.verified === 'true') p.set('verified', 'true')
  if (filters.savedOnly) p.set('saved', 'true')
  return p
}

export function searchParamsToFilters(params) {
  return {
    mode: params.get('mode') === 'match' ? 'match' : 'browse',
    csrFocus: params.get('csrFocus') || '',
    keywords: params.get('keywords') || '',
    q: params.get('q') || '',
    state: params.get('state') || 'All',
    sdg: params.get('sdg') || 'all',
    theme: params.get('theme') || 'All',
    impact: params.get('impact') || 'all',
    budgetRange: params.get('budgetRange') || 'All',
    verified: params.get('verified') === 'true' ? 'true' : 'all',
    savedOnly: params.get('saved') === 'true',
  }
}
