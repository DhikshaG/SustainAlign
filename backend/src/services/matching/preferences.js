import { listProjects } from '../projects/index.js'

function mode(values) {
  if (!values.length) return null
  const counts = new Map()
  for (const v of values) {
    if (!v) continue
    counts.set(v, (counts.get(v) || 0) + 1)
  }
  let best = null
  let bestCount = 0
  for (const [val, count] of counts) {
    if (count > bestCount) {
      best = val
      bestCount = count
    }
  }
  return best
}

function inferBudgetRange(budgetInr) {
  if (!budgetInr) return undefined
  if (budgetInr < 1_000_000) return 'Under 10L'
  if (budgetInr < 2_500_000) return '10L-25L'
  if (budgetInr < 5_000_000) return '25L-50L'
  if (budgetInr < 10_000_000) return '50L-1Cr'
  return '1Cr+'
}

function themeToCsrFocus(themes) {
  const unique = [...new Set(themes.filter(Boolean))]
  if (!unique.length) return ''
  return `CSR programs focused on ${unique.slice(0, 3).join(', ')}`
}

export function deriveDefaultsFromProjects(corporateTenantId) {
  const { projects } = listProjects({ corporateTenantId, audience: 'corporate' })
  const active = projects.filter((p) => !['archived', 'cancelled'].includes(p.status))

  const states = active.map((p) => p.location).filter(Boolean)
  const themes = active.map((p) => p.theme).filter(Boolean)
  const budgets = active.map((p) => p.budgetInr).filter(Boolean)

  const state = mode(states)
  const theme = mode(themes)
  const budgetRange = inferBudgetRange(mode(budgets) || budgets[0])

  return {
    state: state || undefined,
    theme: theme || undefined,
    budgetRange: budgetRange || undefined,
    csrFocus: themeToCsrFocus(themes),
    keywords: themes.slice(0, 3).join(' '),
    sdg: undefined,
    impact: undefined,
  }
}
