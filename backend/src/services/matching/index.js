import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { csrProjects, projectMilestones, tenants } from '../../db/schema.js'
import { listProfiles } from '../ngo/index.js'
import { listProjects } from '../projects/index.js'
import { chatWithSystem, isAiEnabled, checkOllamaHealth, isOllamaModelAvailable } from '../ai/ollama.js'
import {
  scoreNgo,
  buildGenericReason,
} from './scoring.js'
import { deriveDefaultsFromProjects } from './preferences.js'

export { deriveDefaultsFromProjects } from './preferences.js'

const RERANK_CAP = 5

function normalizeCriteria(raw = {}) {
  const csrFocus = raw.csrFocus || raw.goals || ''
  return {
    csrFocus,
    goals: csrFocus,
    keywords: raw.keywords || '',
    state: raw.state,
    district: raw.district,
    sdg: raw.sdg,
    theme: raw.theme,
    impact: raw.impact,
    budgetRange: raw.budgetRange,
  }
}

function buildPerformanceMap(corporateTenantId) {
  const rows = db.select().from(csrProjects)
    .where(eq(csrProjects.corporateTenantId, corporateTenantId))
    .all()

  const byNgoTenant = new Map()
  for (const row of rows) {
    if (!byNgoTenant.has(row.ngoTenantId)) {
      byNgoTenant.set(row.ngoTenantId, [])
    }
    byNgoTenant.get(row.ngoTenantId).push(row)
  }

  const performanceBySlug = new Map()
  for (const [ngoTenantId, projects] of byNgoTenant) {
    const ngo = db.select().from(tenants).where(eq(tenants.id, ngoTenantId)).get()
    if (!ngo?.slug) continue

    let totalScore = 0
    for (const p of projects) {
      const milestones = db.select().from(projectMilestones)
        .where(eq(projectMilestones.projectId, p.id))
        .all()
      let onTime = 100
      if (milestones.length) {
        const today = new Date().toISOString().slice(0, 10)
        const completed = milestones.filter((m) => m.status === 'completed')
        const onTimeCount = completed.filter((m) => !m.dueDate || m.dueDate >= today || m.completedAt).length
        onTime = Math.round((onTimeCount / milestones.length) * 100)
      }
      const impact = p.progress || 0
      totalScore += Math.round(onTime * 0.4 + impact * 0.6)
    }
    performanceBySlug.set(ngo.slug, Math.round(totalScore / projects.length))
  }
  return performanceBySlug
}

function toMatchDto(ngo, scores, { reason, previouslyPartnered }) {
  return {
    slug: ngo.slug,
    name: ngo.name,
    description: ngo.description,
    region: ngo.region,
    focusAreas: ngo.focusAreas,
    verified: ngo.verified,
    sdgs: ngo.sdgs,
    csrThemes: ngo.csrThemes,
    budgetRange: ngo.budgetRange,
    rating: ngo.rating,
    matchPercent: scores.matchPercent,
    credibilityScore: scores.credibilityScore,
    riskScore: scores.riskScore,
    scoreBreakdown: scores.scoreBreakdown,
    reason,
    previouslyPartnered,
    aiRecommended: ngo.aiRecommended,
  }
}

function filterCandidates(criteria) {
  const q = [criteria.keywords, criteria.csrFocus].filter(Boolean).join(' ').trim() || undefined
  const base = {
    verified: 'true',
    state: criteria.state,
    sdg: criteria.sdg,
    theme: criteria.theme,
    impact: criteria.impact,
    q,
    limit: 50,
    offset: 0,
    audience: 'corporate',
  }

  let result = listProfiles(base)
  if (result.ngos.length === 0) {
    result = listProfiles({
      verified: 'true',
      q,
      limit: 50,
      offset: 0,
      audience: 'corporate',
    })
  }
  return result
}

async function applyLlmOverlay(scored, criteria) {
  const top = scored.slice(0, 10)
  const candidates = top.map(({ ngo, scores, previouslyPartnered }) => ({
    slug: ngo.slug,
    name: ngo.name,
    state: ngo.region,
    sectors: ngo.sectors,
    tags: (ngo.tagDetails || []).map((t) => t.label || t.slug),
    tagSlugs: ngo.tags,
    sdgs: ngo.sdgs,
    budgetRange: ngo.budgetRange,
    rating: ngo.rating,
    riskScore: ngo.riskScore,
    credibilityScore: scores.credibilityScore,
    matchPercent: scores.matchPercent,
    previouslyPartnered,
    description: (ngo.description || '').slice(0, 300),
  }))

  const prompt = `CSR focus: ${criteria.csrFocus}
Keywords: ${criteria.keywords || 'none'}
State: ${criteria.state || 'any'}
SDG: ${criteria.sdg || 'any'}
Theme: ${criteria.theme || 'any'}
Budget: ${criteria.budgetRange || 'any'}

Ranked candidates (pre-scored):
${JSON.stringify(candidates)}

Return JSON only: {"ranked":[{"slug":"","reason":""}],"summary":""} — top 5 matches with concise reasons.`

  const raw = await chatWithSystem(
    'You rank NGOs for CSR partnership. Output valid JSON only. Respect pre-computed matchPercent scores.',
    prompt,
  )

  try {
    const parsed = JSON.parse(raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim())
    const rankMap = new Map((parsed.ranked || []).map((r, i) => [r.slug, { reason: r.reason, rank: i }]))

    const reranked = top.map((item) => {
      const llm = rankMap.get(item.ngo.slug)
      let matchPercent = item.scores.matchPercent
      if (llm) {
        const boost = Math.max(0, 5 - llm.rank)
        matchPercent = Math.min(100, matchPercent + boost)
        matchPercent = Math.max(item.scores.matchPercent - RERANK_CAP, Math.min(item.scores.matchPercent + RERANK_CAP, matchPercent))
      }
      const reason = llm?.reason || buildGenericReason(item.scores.scoreBreakdown)
      return {
        ...item,
        scores: { ...item.scores, matchPercent },
        reason,
      }
    })

    reranked.sort((a, b) => {
      const aRank = rankMap.has(a.ngo.slug) ? rankMap.get(a.ngo.slug).rank : 999
      const bRank = rankMap.has(b.ngo.slug) ? rankMap.get(b.ngo.slug).rank : 999
      if (aRank !== bRank) return aRank - bRank
      return b.scores.matchPercent - a.scores.matchPercent
    })

    return {
      matches: reranked.slice(0, 10).map((item) => toMatchDto(item.ngo, item.scores, {
        reason: item.reason,
        previouslyPartnered: item.previouslyPartnered,
      })),
      explanation: parsed.summary || '',
      offline: false,
    }
  } catch {
    return null
  }
}

export function runNgoMatchSync(corporateTenantId, rawCriteria = {}, { limit = 10 } = {}) {
  const criteria = normalizeCriteria(rawCriteria)
  const { ngos } = filterCandidates(criteria)

  const corpProjects = listProjects({ corporateTenantId, audience: 'corporate' })
  const partneredSlugs = new Set(corpProjects.projects.map((p) => p.ngoSlug))

  const performanceBySlug = buildPerformanceMap(corporateTenantId)

  const scored = ngos.map((ngo) => {
    const scores = scoreNgo(ngo, criteria, performanceBySlug)
    return {
      ngo,
      scores,
      previouslyPartnered: partneredSlugs.has(ngo.slug),
      reason: buildGenericReason(scores.scoreBreakdown),
    }
  }).sort((a, b) => b.scores.matchPercent - a.scores.matchPercent)

  return {
    matches: scored.slice(0, limit).map((item) => toMatchDto(item.ngo, item.scores, {
      reason: item.reason,
      previouslyPartnered: item.previouslyPartnered,
    })),
    explanation: 'Ranked by deterministic match scoring across similarity, geography, budget, impact, and credibility.',
    criteria,
    offline: true,
  }
}

export async function runNgoMatch(corporateTenantId, rawCriteria = {}, { limit = 10 } = {}) {
  const criteria = normalizeCriteria(rawCriteria)
  const { ngos } = filterCandidates(criteria)

  const corpProjects = listProjects({ corporateTenantId, audience: 'corporate' })
  const partneredSlugs = new Set(corpProjects.projects.map((p) => p.ngoSlug))

  const performanceBySlug = buildPerformanceMap(corporateTenantId)

  const scored = ngos.map((ngo) => {
    const scores = scoreNgo(ngo, criteria, performanceBySlug)
    return {
      ngo,
      scores,
      previouslyPartnered: partneredSlugs.has(ngo.slug),
      reason: buildGenericReason(scores.scoreBreakdown),
    }
  }).sort((a, b) => b.scores.matchPercent - a.scores.matchPercent)

  const baseResult = {
    matches: scored.slice(0, limit).map((item) => toMatchDto(item.ngo, item.scores, {
      reason: item.reason,
      previouslyPartnered: item.previouslyPartnered,
    })),
    explanation: 'Ranked by deterministic match scoring across similarity, geography, budget, impact, and credibility.',
    criteria,
    offline: true,
  }

  if (!isAiEnabled()) return baseResult

  const online = await checkOllamaHealth()
  const modelReady = online && (await isOllamaModelAvailable())
  if (!modelReady) return baseResult

  const llmResult = await applyLlmOverlay(scored, criteria)
  if (!llmResult) return baseResult

  return {
    ...llmResult,
    criteria,
    matches: llmResult.matches.slice(0, limit),
  }
}

export function getTopRecommendationsSync(corporateTenantId, count = 3) {
  const defaults = deriveDefaultsFromProjects(corporateTenantId)
  if (!defaults.csrFocus && !defaults.theme) {
    defaults.csrFocus = 'Verified NGO partners for CSR programs in India'
  }
  const result = runNgoMatchSync(corporateTenantId, defaults, { limit: count })
  return result.matches.map((m) => ({
    slug: m.slug,
    name: m.name,
    matchPercent: m.matchPercent,
    reason: m.reason,
  }))
}

export async function getTopRecommendations(corporateTenantId, count = 3) {
  const defaults = deriveDefaultsFromProjects(corporateTenantId)
  if (!defaults.csrFocus && !defaults.theme) {
    defaults.csrFocus = 'Verified NGO partners for CSR programs in India'
  }
  const result = await runNgoMatch(corporateTenantId, defaults, { limit: count })
  return result.matches.map((m) => ({
    slug: m.slug,
    name: m.name,
    matchPercent: m.matchPercent,
    reason: m.reason,
  }))
}
