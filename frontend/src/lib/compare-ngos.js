const COMPARE_KEY = 'compareNgosData'

export function getCompareItems() {
  try {
    return JSON.parse(sessionStorage.getItem(COMPARE_KEY) || '[]')
  } catch {
    return []
  }
}

export function setCompareItems(items) {
  sessionStorage.setItem(COMPARE_KEY, JSON.stringify(items.slice(0, 3)))
}

export function toggleCompareItem(ngo) {
  const items = getCompareItems()
  const idx = items.findIndex((i) => i.slug === ngo.slug)
  if (idx >= 0) {
    const next = items.filter((i) => i.slug !== ngo.slug)
    setCompareItems(next)
    return next
  }
  if (items.length >= 3) return items
  const snapshot = {
    slug: ngo.slug,
    name: ngo.name,
    riskScore: ngo.riskScore,
    financialTransparency: ngo.financialTransparency,
    budgetRange: ngo.budgetRange,
    verified: ngo.verified,
    focusAreas: ngo.focusAreas || [],
    sdgs: ngo.sdgs || [],
  }
  const next = [...items, snapshot]
  setCompareItems(next)
  return next
}

export function clearCompareItems() {
  sessionStorage.removeItem(COMPARE_KEY)
}
