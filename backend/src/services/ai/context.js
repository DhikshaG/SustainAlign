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

export async function matchNgos(tenantId, criteria) {
  const { runNgoMatch } = await import('../matching/index.js')
  const normalized = {
    ...criteria,
    csrFocus: criteria.csrFocus || criteria.goals,
    sdg: criteria.sdg || (criteria.sdgs?.length ? criteria.sdgs[0].replace(/^sdg-/, '') : undefined),
  }
  return runNgoMatch(tenantId, normalized)
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
