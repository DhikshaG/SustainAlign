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
import { getDistrictImpact, getSdgProgress } from '../impact/analytics.js'
import { getComplianceSummary } from '../compliance/index.js'
import { listProjects } from '../projects/index.js'
import { listReports } from '../reports/index.js'
import { listProfiles } from '../ngo/index.js'
import { search } from '../search/index.js'
import { chatWithSystem, isAiEnabled, checkOllamaHealth, isOllamaModelAvailable } from './ollama.js'
import { getUnifiedEsgDashboard } from '../esg/index.js'

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
    { id: suggestions.length + 1, prompt: 'How should I allocate unspent CSR funds by district?', category: 'funds' },
    { id: suggestions.length + 1, prompt: 'Summarize our ESG performance across environmental, social, and governance pillars', category: 'esg' },
    { id: suggestions.length + 1, prompt: 'Generate a board-ready CSR report', category: 'reporting' },
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

export async function generateImpactSummary(tenantId) {
  const aggregate = aggregateForTenant(tenantId)
  const districtAnalytics = getDistrictImpact(tenantId)
  const sdgProgress = getSdgProgress(tenantId)

  const context = {
    impact: aggregate.impactSummary,
    sdgProgress,
    districtAnalytics: districtAnalytics.slice(0, 8),
    geoAnalytics: aggregate.geoAnalytics.slice(0, 8),
    activeProjects: aggregate.dashboard.activeProjects,
    budget: aggregate.dashboard.budget,
  }

  if (!isAiEnabled()) {
    return { summary: 'AI disabled. Enable Ollama for impact summaries.', offline: true }
  }

  const online = await checkOllamaHealth()
  const modelReady = online && (await isOllamaModelAvailable())
  if (!modelReady) {
    return {
      summary: online
        ? 'Ollama model not found. Run: ollama pull llama3.1:1b'
        : 'Ollama offline. Start Ollama to generate impact summaries.',
      offline: true,
    }
  }

  const summary = await chatWithSystem(
    'Write a 1-paragraph executive summary of CSR impact for a corporate dashboard. Use only provided data. Mention beneficiaries, SDGs, and geographic reach where available.',
    `Context:\n${JSON.stringify(context)}`,
  )
  return { summary, offline: false }
}

export async function generateReportContent(tenantId, reportContext, type) {
  const aiPayload = {
    type,
    period: { start: reportContext.periodStart, end: reportContext.periodEnd },
    impact: reportContext.aggregate.impactSummary,
    budget: reportContext.budget,
    sdgProgress: reportContext.sdgProgress.slice(0, 8),
    districtAnalytics: reportContext.districtAnalytics.slice(0, 6),
    projects: reportContext.projects.slice(0, 8).map((p) => ({
      name: p.name,
      ngo: p.ngoName,
      progress: p.progress,
      spent: p.spentInr,
      updates: p.updates.slice(0, 2).map((u) => u.body),
      kpis: p.kpis.slice(0, 3),
    })),
    ngoStories: reportContext.impactStories.slice(0, 5),
    updates: reportContext.allUpdates.slice(0, 10).map((u) => ({
      project: u.projectName,
      date: u.date,
      text: u.body,
    })),
    compliance: {
      obligation: reportContext.compliance.section135.csrObligation,
      spent: reportContext.compliance.spend.spent,
      unspent: reportContext.compliance.spend.unspent,
    },
  }

  if (!isAiEnabled()) {
    return { content: null, aiGenerated: false, offline: true }
  }

  const online = await checkOllamaHealth()
  const modelReady = online && (await isOllamaModelAvailable())
  if (!modelReady) {
    return { content: null, aiGenerated: false, offline: true }
  }

  const systemPrompt = `You are a CSR report writer. Using ONLY the JSON context, respond with valid JSON (no markdown fences):
{
  "executiveSummary": "2-3 paragraph executive summary",
  "impactStories": [{ "title": "Story title", "body": "2-3 sentence story" }]
}
Include 2-4 impactStories when type is impact_stories or quarterly or board. Use real project names and numbers from context.`

  const raw = await chatWithSystem(
    systemPrompt,
    `Report type: ${type}\nContext:\n${JSON.stringify(aiPayload)}`,
  )

  try {
    const parsed = JSON.parse(raw.replace(/^```json?\s*|\s*```$/g, '').trim())
    return {
      content: {
        executiveSummary: parsed.executiveSummary || '',
        impactStories: Array.isArray(parsed.impactStories) ? parsed.impactStories : [],
      },
      aiGenerated: true,
      offline: false,
    }
  } catch {
    return {
      content: {
        executiveSummary: raw.slice(0, 2000),
        impactStories: [],
      },
      aiGenerated: true,
      offline: false,
    }
  }
}

export async function generateAllocationRationale(tenantId, intelligenceSummary) {
  if (!isAiEnabled()) {
    return { rationale: null, offline: true }
  }

  const online = await checkOllamaHealth()
  const modelReady = online && (await isOllamaModelAvailable())
  if (!modelReady) {
    return { rationale: null, offline: true }
  }

  const rationale = await chatWithSystem(
    'Write a 2-3 sentence CSR fund allocation rationale for a corporate CSR head. Use only provided data. Mention top districts and themes.',
    `Context:\n${JSON.stringify(intelligenceSummary)}`,
  )
  return { rationale, offline: false }
}

export async function generateEsgSummary(tenantId, unifiedDto) {
  const payload = unifiedDto || getUnifiedEsgDashboard(tenantId)

  const context = {
    pillars: {
      environmental: { score: payload.pillars?.environmental?.score, highlights: payload.pillars?.environmental?.highlights },
      social: { score: payload.pillars?.social?.score, highlights: payload.pillars?.social?.highlights },
      governance: { score: payload.pillars?.governance?.score, highlights: payload.pillars?.governance?.highlights },
    },
    sdgAlignment: (payload.sdgAlignment || []).slice(0, 6),
    brsrGaps: (payload.brsr || []).filter((b) => b.status === 'no_data').map((b) => b.title),
    csrSummary: payload.csrSummary,
  }

  if (!isAiEnabled()) {
    return { summary: 'AI disabled. Enable Ollama for ESG summaries.', offline: true }
  }

  const online = await checkOllamaHealth()
  const modelReady = online && (await isOllamaModelAvailable())
  if (!modelReady) {
    return {
      summary: online
        ? 'Ollama model not found. Run: ollama pull llama3.1:1b'
        : 'Ollama offline. Start Ollama to generate ESG summaries.',
      offline: true,
    }
  }

  const summary = await chatWithSystem(
    'Write a 1-paragraph ESG executive summary for a corporate dashboard. Cover environmental, social, and governance pillars. Use only provided data. Mention SDG alignment and BRSR gaps where relevant.',
    `Context:\n${JSON.stringify(context)}`,
  )
  return { summary, offline: false }
}
