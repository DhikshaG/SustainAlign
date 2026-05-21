import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { csrProjects, ngoProfiles, tenants } from '../../db/schema.js'
import { getFundAllocation, getComplianceSummary } from '../compliance/index.js'
import { getDistrictImpact, getSdgProgress } from '../impact/analytics.js'
import { aggregateForTenant } from '../impact/index.js'
import { runNgoMatchSync } from '../matching/index.js'

const THEME_TO_SDG = {
  Healthcare: { sdg: 3, label: 'SDG 3' },
  Education: { sdg: 4, label: 'SDG 4' },
  Environment: { sdg: 13, label: 'SDG 13' },
  Livelihood: { sdg: 8, label: 'SDG 8' },
  'Rural Development': { sdg: 1, label: 'SDG 1' },
  'Clean Water': { sdg: 6, label: 'SDG 6' },
  'Women Empowerment': { sdg: 5, label: 'SDG 5' },
}

const SCENARIO_WEIGHTS = {
  baseline: {
    Education: 20,
    Healthcare: 25,
    Environment: 18,
    Livelihood: 15,
    'Rural Development': 10,
    Other: 12,
  },
  balanced: {
    Education: 22,
    Healthcare: 22,
    Environment: 20,
    Livelihood: 14,
    'Rural Development': 12,
    Other: 10,
  },
  aggressive: {
    Education: 15,
    Healthcare: 30,
    Environment: 22,
    Livelihood: 12,
    'Rural Development': 8,
    Other: 13,
  },
}

function parseJson(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function amountToBudgetRange(amount) {
  if (amount < 1_000_000) return 'Under 10L'
  if (amount < 2_500_000) return '10L-25L'
  if (amount < 5_000_000) return '25L-50L'
  if (amount < 10_000_000) return '50L-1Cr'
  return '1Cr+'
}

function collectPartnerDistricts(corporateTenantId) {
  const projects = db.select().from(csrProjects)
    .where(eq(csrProjects.corporateTenantId, corporateTenantId))
    .all()
  const districts = new Map()
  for (const p of projects) {
    const profile = db.select().from(ngoProfiles)
      .where(eq(ngoProfiles.tenantId, p.ngoTenantId))
      .get()
    const served = parseJson(profile?.districtsServed)
    for (const d of served) {
      const key = String(d).trim()
      if (!key) continue
      districts.set(key, (districts.get(key) || 0) + 1)
    }
  }
  return districts
}

export function buildAllocationContext(tenantId) {
  const funds = getFundAllocation(tenantId)
  const compliance = getComplianceSummary(tenantId)
  const aggregate = aggregateForTenant(tenantId)
  const districtImpact = getDistrictImpact(tenantId)
  const sdgProgress = getSdgProgress(tenantId)
  const partnerDistrictCounts = collectPartnerDistricts(tenantId)

  return {
    tenantId,
    obligation: funds.obligation,
    totalBudget: funds.totalBudget,
    totalSpent: funds.totalSpent,
    unallocated: funds.unallocated,
    categories: funds.categories,
    projects: funds.projects,
    districtImpact,
    sdgProgress,
    ngoPerformance: aggregate.ngoPerformance,
    localAreaTargetPct: compliance.section135?.localAreaTargetPct ?? 70,
    partnerDistrictCounts,
  }
}

export function scoreDistrictNeeds(context, { sdgFocus = [] } = {}) {
  const maxSpend = Math.max(...context.districtImpact.map((d) => d.spend), 1)
  const maxBen = Math.max(...context.districtImpact.map((d) => d.beneficiaries), 1)

  const districtMap = new Map()
  for (const d of context.districtImpact) {
    districtMap.set(d.district, { ...d, ngoPresence: context.partnerDistrictCounts.get(d.district) || 0 })
  }
  for (const [district, count] of context.partnerDistrictCounts) {
    if (!districtMap.has(district)) {
      districtMap.set(district, {
        district,
        state: district.split(',').pop()?.trim() || 'Unknown',
        beneficiaries: 0,
        spend: 0,
        projects: 0,
        ngoPresence: count,
      })
    }
  }

  const sdgThemes = sdgFocus.length
    ? context.sdgProgress.filter((s) => sdgFocus.includes(s.sdg))
    : context.sdgProgress

  const scored = [...districtMap.values()].map((d) => {
    const spendGap = 1 - (d.spend / maxSpend)
    const benGap = 1 - (d.beneficiaries / maxBen)
    const ngoBoost = Math.min(d.ngoPresence / 3, 1) * 0.15
    const needScore = Math.round((spendGap * 0.45 + benGap * 0.35 + ngoBoost) * 100)

    const topSdg = sdgThemes[0]
    const sdgGap = topSdg ? `${topSdg.label}` : (THEME_TO_SDG.Education?.label || 'SDG 4')

    return {
      district: d.district,
      state: d.state,
      needScore,
      currentSpend: d.spend,
      beneficiaries: d.beneficiaries,
      projects: d.projects,
      ngoPresence: d.ngoPresence,
      sdgGap,
    }
  }).sort((a, b) => b.needScore - a.needScore)

  return scored.map((d, i) => {
    const priority = d.needScore >= 70 ? 'high' : d.needScore >= 45 ? 'medium' : 'low'
    return { ...d, rank: i + 1, priority }
  })
}

export function recommendThemeSplit(context, { budgetToAllocate, scenario = 'balanced', sdgFocus = [] } = {}) {
  const budget = budgetToAllocate ?? context.unallocated
  if (budget <= 0) return []

  const weights = { ...SCENARIO_WEIGHTS[scenario] || SCENARIO_WEIGHTS.balanced }
  const currentByTheme = new Map((context.categories || []).map((c) => [c.theme, c.allocated || 0]))

  const themesInUse = new Set([
    ...Object.keys(weights),
    ...(context.categories || []).map((c) => c.theme),
    ...context.sdgProgress.map((s) => {
      const entry = Object.entries(THEME_TO_SDG).find(([, v]) => v.sdg === s.sdg)
      return entry?.[0]
    }).filter(Boolean),
  ])
  themesInUse.delete('Other')

  const themeList = [...themesInUse]
  if (!themeList.includes('Other')) themeList.push('Other')

  let totalWeight = 0
  const adjusted = themeList.map((theme) => {
    let w = weights[theme] ?? weights.Other ?? 10
    const sdgInfo = THEME_TO_SDG[theme]
    if (sdgFocus.length && sdgInfo && sdgFocus.includes(sdgInfo.sdg)) w *= 1.3
    const sdgEntry = context.sdgProgress.find((s) => s.sdg === sdgInfo?.sdg)
    if (sdgEntry && sdgEntry.beneficiaries < (context.sdgProgress[0]?.beneficiaries || 0) * 0.5) w *= 1.15
    totalWeight += w
    return { theme, weight: w, currentAllocated: currentByTheme.get(theme) || 0, sdg: sdgInfo?.label }
  })

  return adjusted.map(({ theme, weight, currentAllocated, sdg }) => {
    const pct = Math.round((weight / totalWeight) * 100)
    const recommended = Math.round(budget * (weight / totalWeight))
    return { theme, currentAllocated, recommended, pct, sdg: sdg || null }
  })
}

function allocateDistrictBudgets(districts, budget) {
  if (!districts.length || budget <= 0) return districts.map((d) => ({ ...d, recommendedAllocation: 0 }))
  const totalNeed = districts.reduce((s, d) => s + d.needScore, 0) || 1
  return districts.map((d) => ({
    ...d,
    recommendedAllocation: Math.round(budget * (d.needScore / totalNeed)),
  }))
}

export function recommendNgos(context, { districtPlan, themePlan, limit = 10 }) {
  const performanceMap = new Map((context.ngoPerformance || []).map((n) => [n.ngo, n.score]))
  const seen = new Set()
  const results = []

  const topDistricts = districtPlan.slice(0, 4)
  const topThemes = themePlan.filter((t) => t.theme !== 'Other').slice(0, 3)

  for (const district of topDistricts) {
    for (const theme of topThemes) {
      const sliceAmount = Math.max(
        Math.round((district.recommendedAllocation || 0) / topThemes.length),
        Math.round((theme.recommended || 0) / topDistricts.length),
        500_000,
      )
      const state = district.state?.split(',')[0]?.trim() || district.state
      const match = runNgoMatchSync(context.tenantId, {
        csrFocus: `${theme.theme} programs in ${district.district}`,
        theme: theme.theme.toLowerCase().replace(/\s+/g, '-'),
        state,
        district: district.district,
        budgetRange: amountToBudgetRange(sliceAmount),
      }, { limit: 3 })

      for (const m of match.matches) {
        if (seen.has(m.slug)) continue
        seen.add(m.slug)
        results.push({
          slug: m.slug,
          name: m.name,
          district: district.district,
          state,
          theme: theme.theme,
          suggestedAmount: sliceAmount,
          matchPercent: m.matchPercent,
          performanceScore: performanceMap.get(m.name) ?? m.scoreBreakdown?.pastImpact ?? 0,
          reason: m.reason,
          previouslyPartnered: m.previouslyPartnered,
        })
      }
    }
  }

  return results
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, limit)
}

export async function runAllocationIntelligence(tenantId, options = {}) {
  const {
    budgetToAllocate,
    scenario = 'balanced',
    sdgFocus = [],
    includeAi = true,
    limit = 10,
  } = options

  const context = buildAllocationContext(tenantId)
  const budget = budgetToAllocate ?? context.unallocated

  const districts = scoreDistrictNeeds(context, { sdgFocus })
  const themeSplit = recommendThemeSplit(context, { budgetToAllocate: budget, scenario, sdgFocus })
  const districtPlan = allocateDistrictBudgets(districts.slice(0, 8), Math.round(budget * 0.6))
  const ngos = recommendNgos(context, { districtPlan, themePlan: themeSplit, limit })

  let rationale = null
  let offline = true
  if (includeAi) {
    const { generateAllocationRationale } = await import('../ai/context.js')
    const aiResult = await generateAllocationRationale(tenantId, {
      themeSplit: themeSplit.slice(0, 5),
      districts: districtPlan.slice(0, 5),
      ngos: ngos.slice(0, 3),
      budget,
      unallocated: context.unallocated,
    })
    rationale = aiResult.rationale
    offline = aiResult.offline
  }

  return {
    input: {
      obligation: context.obligation,
      totalBudget: context.totalBudget,
      totalSpent: context.totalSpent,
      unallocated: context.unallocated,
      budgetToAllocate: budget,
      scenario,
    },
    themeSplit,
    districts: districtPlan,
    ngos,
    rationale,
    offline,
  }
}
