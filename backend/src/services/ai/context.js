import { eq, and, isNull, desc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  tenants,
  ngoProfiles,
  csrProjects,
  complianceAlerts,
  workflowInstances,
} from '../../db/schema.js'
import { aggregateForTenant } from '../impact/index.js'
import { getComplianceSummary } from '../compliance/index.js'
import { listProjects } from '../projects/index.js'
import { listReports } from '../reports/index.js'
import { listProfiles } from '../ngo/index.js'
import { search } from '../search/index.js'
import { chatWithSystem, isAiEnabled, checkOllamaHealth, isOllamaModelAvailable } from './ollama.js'

const SYSTEM_GROUNDED = `You are SustainAlign CSR copilot. Answer ONLY using the JSON context provided.
If the context lacks information, reply with exactly: insufficient_data
Be concise. Cite project names and numbers from context. Do not invent NGOs or figures.`

export function buildTenantContext(tenantId) {
  const aggregate = aggregateForTenant(tenantId)
  const compliance = getComplianceSummary(tenantId)
  const projects = listProjects({ corporateTenantId: tenantId, audience: 'corporate' })
  const reports = listReports(tenantId)
  const alerts = db.select().from(complianceAlerts)
    .where(and(eq(complianceAlerts.tenantId, tenantId), isNull(complianceAlerts.acknowledgedAt)))
    .limit(5)
    .all()

  return {
    impact: aggregate.impactSummary,
    sdgMapping: aggregate.sdgMapping,
    ngoPerformance: aggregate.ngoPerformance.slice(0, 5),
    compliance: {
      obligation: compliance.section135.csrObligation,
      spent: compliance.spend.spent,
      unspent: compliance.spend.unspent,
      score: compliance.auditReadiness.score,
    },
    projects: projects.projects.slice(0, 10).map((p) => ({
      id: p.id,
      name: p.name,
      ngo: p.ngoName,
      progress: p.progress,
      spent: p.spentInr,
      location: p.location,
    })),
    reports: reports.slice(0, 3),
    alerts: alerts.map((a) => ({ level: a.level, message: a.message })),
  }
}

export function getCopilotSuggestions(tenantId) {
  const compliance = getComplianceSummary(tenantId)
  const suggestions = []

  for (const alert of compliance.alerts.slice(0, 2)) {
    suggestions.push({
      id: suggestions.length + 1,
      prompt: alert.message,
      category: 'compliance',
    })
  }

  const pending = db.select().from(workflowInstances)
    .where(and(eq(workflowInstances.tenantId, tenantId), eq(workflowInstances.status, 'pending')))
    .limit(1)
    .all()
  if (pending.length) {
    suggestions.push({
      id: suggestions.length + 1,
      prompt: 'What approvals are pending in my workflow inbox?',
      category: 'workflow',
    })
  }

  suggestions.push(
    { id: suggestions.length + 1, prompt: 'Summarize our CSR impact this quarter', category: 'impact' },
    { id: suggestions.length + 1, prompt: 'Which NGOs are performing best?', category: 'projects' },
  )

  return suggestions.slice(0, 5)
}

export async function copilotChat(tenantId, message, history = []) {
  if (!isAiEnabled()) {
    return { reply: 'AI is disabled. Set AI_ENABLED=true and start Ollama.', offline: true }
  }

  const online = await checkOllamaHealth()
  const modelReady = online && (await isOllamaModelAvailable())
  if (!modelReady) {
    return {
      reply: online
        ? 'Ollama model not found. Run: ollama pull llama3.1:1b'
        : 'Ollama is offline. Run: ollama pull llama3.1:1b && ollama serve',
      offline: true,
    }
  }

  const context = buildTenantContext(tenantId)
  const contextStr = JSON.stringify(context, null, 2)
  const reply = await chatWithSystem(
    SYSTEM_GROUNDED,
    `Context:\n${contextStr}\n\nUser question: ${message}`,
    history,
  )
  return { reply, offline: false }
}

export async function matchNgos(tenantId, { goals, state, sdgs = [] }) {
  const filters = { verified: true, limit: 20 }
  if (state) filters.state = state
  if (sdgs?.length) filters.sdg = sdgs[0]

  const { ngos } = listProfiles({ ...filters, audience: 'corporate' })

  const projects = listProjects({ corporateTenantId: tenantId, audience: 'corporate' })
  const partneredSlugs = new Set(projects.projects.map((p) => p.ngoSlug))

  const candidates = ngos.slice(0, 15).map((n) => ({
    slug: n.slug,
    name: n.name,
    state: n.region,
    sectors: n.sectors,
    tags: n.tags?.map((t) => t.label) || [],
    rating: n.rating,
    previouslyPartnered: partneredSlugs.has(n.slug),
  }))

  if (!isAiEnabled()) {
    return { matches: candidates.slice(0, 5), explanation: 'AI disabled — showing filter results.' }
  }

  const online = await checkOllamaHealth()
  const modelReady = online && (await isOllamaModelAvailable())
  if (!modelReady) {
    return {
      matches: candidates.slice(0, 5),
      explanation: online ? 'Ollama model missing — showing filter results.' : 'Ollama offline — showing filter results.',
      offline: true,
    }
  }

  const prompt = `Goals: ${goals}\nState preference: ${state || 'any'}\nSDGs: ${sdgs.join(', ') || 'any'}\n\nNGO candidates JSON:\n${JSON.stringify(candidates)}\n\nReturn JSON only: {"ranked":[{"slug":"","reason":""}],"summary":""} — top 5 matches.`
  const raw = await chatWithSystem(
    'You rank NGOs for CSR partnership. Output valid JSON only.',
    prompt,
  )

  try {
    const parsed = JSON.parse(raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim())
    const ranked = (parsed.ranked || []).slice(0, 5).map((r) => {
      const ngo = candidates.find((c) => c.slug === r.slug) || ngos.find((n) => n.slug === r.slug)
      return { ...ngo, reason: r.reason }
    }).filter(Boolean)
    return { matches: ranked, explanation: parsed.summary || '', offline: false }
  } catch {
    return { matches: candidates.slice(0, 5), explanation: raw.slice(0, 500), offline: false }
  }
}

export async function aiSearch(tenantId, query) {
  const ftsResults = search({ q: query, tenantId, limit: 10 })
  const results = Array.isArray(ftsResults) ? ftsResults : []

  if (!isAiEnabled()) {
    return { answer: `Found ${results.length} results for "${query}".`, results }
  }

  const online = await checkOllamaHealth()
  const modelReady = online && (await isOllamaModelAvailable())
  if (!modelReady) {
    return {
      answer: online
        ? `Ollama model missing. Keyword results for "${query}":`
        : `Ollama offline. Keyword results for "${query}":`,
      results,
      offline: true,
    }
  }

  const context = {
    query,
    searchResults: results.slice(0, 8),
    tenantSnapshot: buildTenantContext(tenantId),
  }

  const answer = await chatWithSystem(
    SYSTEM_GROUNDED,
    `Context:\n${JSON.stringify(context)}\n\nAnswer the user's search question naturally in 2-4 sentences.`,
  )
  return { answer, results, offline: false }
}

export async function generateNarrative(tenantId, { reportId, projectId }) {
  let focus = {}
  if (projectId) {
    const projects = listProjects({ corporateTenantId: tenantId, audience: 'corporate' })
    focus = projects.projects.find((p) => p.id === projectId) || {}
  } else if (reportId) {
    focus = { report: listReports(tenantId).find((r) => r.id === reportId) }
  }

  const context = { ...buildTenantContext(tenantId), focus }

  if (!isAiEnabled()) {
    return { narrative: 'AI disabled. Enable Ollama for narrative generation.' }
  }

  const online = await checkOllamaHealth()
  const modelReady = online && (await isOllamaModelAvailable())
  if (!modelReady) {
    return {
      narrative: online
        ? 'Ollama model not found. Run: ollama pull llama3.1:1b'
        : 'Ollama offline. Start Ollama to generate narratives.',
      offline: true,
    }
  }

  const narrative = await chatWithSystem(
    'Write a 1-paragraph CSR impact narrative for a board report. Use only provided data.',
    `Context:\n${JSON.stringify(context)}`,
  )
  return { narrative, offline: false }
}
