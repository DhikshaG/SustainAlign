import { eq, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { vectorDocuments, tenants } from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { getProfileByTenantId, listProfiles } from '../ngo/index.js'
import { runNgoMatch } from '../matching/index.js'
import { search } from '../search/index.js'
import {
  chatWithSystem,
  ollamaEmbed,
  isAiEnabled,
  checkOllamaHealth,
  isOllamaModelAvailable,
  isEmbedModelAvailable,
} from './ollama.js'
import { cosineSimilarity, parseEmbedding } from './vector.js'
import { buildTenantContext, copilotChat } from './context.js'

const SYSTEM_RAG = `You are SustainAlign CSR copilot. Answer ONLY using the retrieved NGO context provided.
If context is insufficient, reply with exactly: insufficient_data
Recommend specific NGOs by name when relevant. Be concise (3-5 sentences). Do not invent NGOs or figures.`

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Puducherry',
]

const THEME_KEYWORDS = {
  healthcare: ['health', 'healthcare', 'medical', 'hospital', 'clinic'],
  education: ['education', 'school', 'literacy', 'learning', 'scholarship'],
  environment: ['environment', 'climate', 'tree', 'afforestation', 'water', 'sanitation'],
  'women-empowerment': ['women', 'gender', 'empowerment', 'livelihood'],
  'rural-development': ['rural', 'village', 'agriculture', 'farmer'],
}

const NGO_QUERY_PATTERNS = [
  /\b(suggest|recommend|find|search|which|what)\b.*\b(ngo|ngos|organization|partner)\b/i,
  /\bngo\b.*\b(for|in|with)\b/i,
  /\b(healthcare|education|environment)\b.*\b(ngo|karnataka|maharashtra|india)\b/i,
]

export function isNgoDiscoveryQuery(message) {
  return NGO_QUERY_PATTERNS.some((re) => re.test(message))
}

export function extractQueryFilters(query) {
  const lower = query.toLowerCase()
  const filters = { q: query }

  for (const state of INDIAN_STATES) {
    if (lower.includes(state.toLowerCase())) {
      filters.state = state
      break
    }
  }

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      filters.theme = theme
      break
    }
  }

  const sdgMatch = lower.match(/sdg[\s-]?(\d{1,2})/)
  if (sdgMatch) filters.sdg = sdgMatch[1]

  return filters
}

function chunkNgoProfile(dto) {
  const base = [
    `${dto.name}. ${dto.description || ''}`.trim(),
    `Region: ${dto.region}. States: ${(dto.statesServed || []).join(', ')}. Sector: ${dto.primarySector || dto.sector}.`,
    `Focus: ${(dto.focusAreas || []).join(', ')}. SDGs: ${(dto.sdgs || []).join(', ')}. Budget: ${dto.budgetRange || 'N/A'}.`,
  ]
  const projects = (dto.pastProjects || [])
    .slice(0, 3)
    .map((p) => `Past project: ${p.title} Ã¢â‚¬â€ ${p.description || p.outcome || ''}`)
  const metricsArr = Array.isArray(dto.impactMetrics)
    ? dto.impactMetrics
    : Object.entries(dto.impactMetrics || {}).map(([k, v]) => ({ label: k, value: v }))
  const metrics = metricsArr.slice(0, 3).map((m) => `Impact: ${m.label} ${m.value}${m.unit ? ` ${m.unit}` : ''}`)
  return [...base, ...projects, ...metrics].filter((t) => t.length > 10)
}

export async function indexNgoProfile(tenantId) {
  const dto = getProfileByTenantId(tenantId, 'corporate')
  if (!dto?.slug) return 0

  const chunks = chunkNgoProfile(dto)
  const metadata = JSON.stringify({
    slug: dto.slug,
    name: dto.name,
    state: dto.region,
    sectors: dto.focusAreas,
    sdgs: dto.sdgs,
  })

  await db
    .delete(vectorDocuments)
    .where(and(eq(vectorDocuments.entityType, 'ngo_profile'), eq(vectorDocuments.entityId, dto.slug)))
    .run()

  let embedReady = false
  if (isAiEnabled()) {
    const online = await checkOllamaHealth()
    embedReady = online && (await isEmbedModelAvailable())
  }

  const now = new Date()
  let indexed = 0
  for (let i = 0; i < chunks.length; i += 1) {
    let embedding = []
    if (embedReady) {
      try {
        embedding = await ollamaEmbed(chunks[i])
      } catch {
        embedding = []
      }
    }
    await db
      .insert(vectorDocuments)
      .values({
        id: newId(),
        entityType: 'ngo_profile',
        entityId: dto.slug,
        chunkIndex: i,
        text: chunks[i],
        embedding: JSON.stringify(embedding),
        metadata,
        updatedAt: now,
      })
      .run()
    indexed += 1
  }
  return indexed
}

export async function reindexAllVectors() {
  const ngoTenants = await db.select().from(tenants).where(eq(tenants.type, 'ngo')).all()
  let total = 0
  for (const t of ngoTenants) {
    total += await indexNgoProfile(t.id)
  }
  return { chunksIndexed: total, ngos: ngoTenants.length }
}

export async function semanticSearch(query, { limit = 8, filters = {} } = {}) {
  const rows = await db.select().from(vectorDocuments).where(eq(vectorDocuments.entityType, 'ngo_profile')).all()

  if (!rows.length) return []

  let queryVec = []
  if (isAiEnabled()) {
    const online = await checkOllamaHealth()
    const embedReady = online && (await isEmbedModelAvailable())
    if (embedReady) {
      try {
        queryVec = await ollamaEmbed(query)
      } catch {
        queryVec = []
      }
    }
  }

  const scored = rows.map((row) => {
    const meta = row.metadata ? JSON.parse(row.metadata) : {}
    let score = 0
    if (queryVec.length) {
      const vec = parseEmbedding(row.embedding)
      score = cosineSimilarity(queryVec, vec)
    } else {
      const lower = query.toLowerCase()
      const textLower = row.text.toLowerCase()
      const terms = lower.split(/\s+/).filter((t) => t.length > 3)
      score = terms.filter((t) => textLower.includes(t)).length / Math.max(terms.length, 1)
    }
    if (filters.state && meta.state?.toLowerCase?.().includes(filters.state.toLowerCase())) {
      score += 0.15
    }
    if (filters.theme && meta.sectors?.some?.((s) => s.toLowerCase().includes(filters.theme.replace('-', ' ')))) {
      score += 0.1
    }
    return { row, meta, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map(({ row, meta, score }) => ({
    entityType: row.entityType,
    entityId: row.entityId,
    slug: meta.slug,
    name: meta.name,
    region: meta.state,
    snippet: row.text.slice(0, 200),
    score,
    source: 'vector',
  }))
}

function mergeRecommendations(...lists) {
  const bySlug = new Map()
  for (const list of lists) {
    for (const item of list) {
      const slug = item.slug
      if (!slug) continue
      const existing = bySlug.get(slug)
      if (!existing || (item.matchPercent ?? item.score ?? 0) > (existing.matchPercent ?? existing.score ?? 0)) {
        bySlug.set(slug, item)
      }
    }
  }
  return [...bySlug.values()]
    .sort((a, b) => (b.matchPercent ?? b.score ?? 0) - (a.matchPercent ?? a.score ?? 0))
    .slice(0, 8)
}

export async function ragRecommendNgos(tenantId, query) {
  const filters = extractQueryFilters(query)
  const offline = !isAiEnabled() || !(await checkOllamaHealth()) || !(await isOllamaModelAvailable())

  const structured = listProfiles({
    state: filters.state,
    theme: filters.theme,
    sdg: filters.sdg,
    q: query,
    limit: 8,
    audience: 'corporate',
  }).ngos.map((ngo) => ({
    slug: ngo.slug,
    name: ngo.name,
    region: ngo.region,
    matchPercent: 70,
    reasons: [`Matches filters: ${filters.state || filters.theme || 'keyword search'}`],
    source: 'structured',
    verified: ngo.verified,
    description: ngo.description,
  }))

  const vectorHits = await semanticSearch(query, { limit: 6, filters })
  const vectorRecs = vectorHits.map((h) => ({
    slug: h.slug,
    name: h.name,
    region: h.region,
    matchPercent: Math.round(Math.min(h.score * 100, 99)),
    reasons: [h.snippet.slice(0, 120)],
    source: 'vector',
  }))

  const matchResult = await runNgoMatch(tenantId, {
    csrFocus: query,
    state: filters.state,
    theme: filters.theme,
    sdg: filters.sdg,
    keywords: query,
  })
  const matchRecs = (matchResult.matches || []).slice(0, 6).map((m) => ({
    ...m,
    source: 'match',
  }))

  const recommendations = mergeRecommendations(structured, vectorRecs, matchRecs)
  const citations = vectorHits.slice(0, 4).map((h) => ({
    entityType: h.entityType,
    entityId: h.entityId,
    snippet: h.snippet,
  }))

  let reply
  if (offline || !recommendations.length) {
    reply = recommendations.length
      ? `Found ${recommendations.length} NGO(s) matching "${query}". Top: ${recommendations
          .slice(0, 3)
          .map((r) => r.name)
          .join(', ')}.`
      : `No NGOs found matching "${query}". Try broadening location or theme filters.`
    return { reply, recommendations, citations, offline: true }
  }

  const context = {
    query,
    filters,
    recommendations: recommendations.slice(0, 6).map((r) => ({
      name: r.name,
      slug: r.slug,
      region: r.region,
      matchPercent: r.matchPercent,
      reasons: r.reasons,
    })),
    tenantSnapshot: buildTenantContext(tenantId),
  }

  reply = await chatWithSystem(
    SYSTEM_RAG,
    `Retrieved context:\n${JSON.stringify(context, null, 2)}\n\nUser question: ${query}`,
  )

  if (reply === 'insufficient_data' && recommendations.length) {
    reply = `Based on your query, I recommend ${recommendations
      .slice(0, 3)
      .map((r) => `${r.name} (${r.region || 'India'})`)
      .join(', ')}. These NGOs align with ${filters.theme || filters.state || 'your CSR focus'}.`
  }

  return { reply, recommendations, citations, offline: false }
}

export async function ragCopilotChat(tenantId, message, history = []) {
  if (!isNgoDiscoveryQuery(message)) {
    return copilotChat(tenantId, message, history)
  }
  return ragRecommendNgos(tenantId, message)
}
