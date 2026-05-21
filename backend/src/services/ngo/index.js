import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  tenants,
  ngoProfiles,
  ngoTeamMembers,
  ngoPastProjects,
  ngoImpactMetrics,
  ngoImpactStories,
  ngoCertifications,
  ngoDocuments,
  files,
  tags,
} from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { getEntityTags, setEntityTags, findEntitiesByTagGroups, resolveStateGeographySlug, resolveThemeSlug, resolveImpactSlug } from '../tags/index.js'
import { logMutation } from '../activity-log/index.js'
import { indexDocument, search } from '../search/index.js'
import { storeFile, listFiles, getFileById } from '../files/index.js'
import { getStorage } from '../../lib/storage/index.js'

const MEDIA_CATEGORIES = ['logo', 'gallery_image', 'gallery_video', 'report', 'public_document']

function parseJson(val, fallback = []) {
  if (!val) return fallback
  try {
    return JSON.parse(val)
  } catch {
    return fallback
  }
}

function formatBeneficiaries(count) {
  if (!count) return '0'
  if (count >= 1000) return `${Math.floor(count / 1000)},000+`
  return String(count)
}

function loadChildRows(tenantId) {
  return {
    team: db.select().from(ngoTeamMembers)
      .where(eq(ngoTeamMembers.tenantId, tenantId))
      .all()
      .sort((a, b) => a.sortOrder - b.sortOrder),
    pastProjects: db.select().from(ngoPastProjects)
      .where(eq(ngoPastProjects.tenantId, tenantId))
      .all()
      .sort((a, b) => a.sortOrder - b.sortOrder),
    impactMetrics: db.select().from(ngoImpactMetrics)
      .where(eq(ngoImpactMetrics.tenantId, tenantId))
      .all(),
    impactStories: db.select().from(ngoImpactStories)
      .where(eq(ngoImpactStories.tenantId, tenantId))
      .all(),
    certifications: db.select().from(ngoCertifications)
      .where(eq(ngoCertifications.tenantId, tenantId))
      .all(),
    verificationDocs: db.select().from(ngoDocuments)
      .where(eq(ngoDocuments.tenantId, tenantId))
      .all(),
    mediaFiles: db.select().from(files)
      .where(and(
        eq(files.tenantId, tenantId),
        eq(files.entityType, 'ngo'),
        eq(files.entityId, tenantId),
      ))
      .all(),
  }
}

function tagsToThemes(tagList) {
  const sdgs = tagList
    .filter((t) => t.slug.startsWith('sdg-'))
    .map((t) => parseInt(t.slug.replace('sdg-', ''), 10))
    .filter((n) => !Number.isNaN(n))
  const themeSlugs = ['education', 'healthcare', 'environment', 'women-empowerment', 'rural-development']
  const csrThemes = tagList.filter((t) => themeSlugs.includes(t.slug)).map((t) => t.label)
  const focusAreas = tagList
    .filter((t) => t.metadata?.type !== 'state' && t.metadata?.type !== 'settlement' && !t.slug.startsWith('sdg-'))
    .map((t) => t.label)
  return { sdgs, csrThemes, focusAreas: focusAreas.length ? focusAreas : csrThemes }
}

function buildDocuments(verificationDocs, mediaFiles, certifications) {
  const docs = verificationDocs.map((d) => ({
    id: d.id,
    name: d.originalName,
    type: d.docType,
    uploaded: d.uploadedAt instanceof Date ? d.uploadedAt.toISOString().slice(0, 10) : d.uploadedAt,
    source: 'verification',
  }))
  for (const f of mediaFiles.filter((m) => m.category === 'public_document' || m.category === 'report')) {
    docs.push({
      id: f.id,
      name: f.originalName,
      type: f.category,
      uploaded: f.createdAt instanceof Date ? f.createdAt.toISOString().slice(0, 10) : null,
      source: 'media',
      downloadUrl: `/api/files/${f.id}/download`,
    })
  }
  for (const c of certifications) {
    if (!docs.some((d) => d.name === c.name)) {
      docs.push({
        id: c.id,
        name: c.name,
        type: 'certification',
        uploaded: c.issuedAt,
        status: c.status,
      })
    }
  }
  return docs
}

export function formatNgoDto({ tenant, profile, tagList, children, audience = 'corporate' }) {
  const { sdgs, csrThemes, focusAreas } = tagsToThemes(tagList)
  const statesServed = parseJson(profile?.statesServed)
  const districtsServed = parseJson(profile?.districtsServed)
  const sectors = parseJson(profile?.sectors)
  const verified = profile?.verificationStatus === 'verified'

  const impactMetrics = {}
  for (const m of children.impactMetrics) {
    impactMetrics[m.metricKey] = m.value
  }

  const media = {
    logo: children.mediaFiles.find((f) => f.category === 'logo') || null,
    gallery: children.mediaFiles.filter((f) => f.category === 'gallery_image'),
    videos: children.mediaFiles.filter((f) => f.category === 'gallery_video'),
    reports: children.mediaFiles.filter((f) => f.category === 'report'),
  }

  const base = {
    tenantId: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    sector: profile?.primarySector || sectors[0] || 'General',
    region: profile?.region || statesServed[0] || 'India',
    verified,
    verificationStatus: profile?.verificationStatus || 'pending',
    description: profile?.description || '',
    focusAreas: focusAreas.length ? focusAreas : sectors,
    beneficiaries: formatBeneficiaries(profile?.beneficiariesCount),
    beneficiariesCount: profile?.beneficiariesCount || 0,
    projects: profile?.projectsCount || 0,
    registrationNumber: profile?.registrationNumber,
    csr1Number: profile?.csr1Number,
    pan: profile?.pan,
    website: profile?.website,
    contactPerson: profile?.contactPerson,
    email: profile?.email,
    phone: profile?.phone,
    statesServed,
    districtsServed,
    districts: districtsServed,
    settlementType: profile?.settlementType,
    yearsActive: profile?.yearsActive,
    annualFundingInr: profile?.annualFundingInr,
    teamSize: profile?.teamSize,
    budgetRange: profile?.budgetRange,
    orgSize: profile?.orgSize,
    sdgs,
    csrThemes: csrThemes.length ? csrThemes : sectors,
    tags: tagList.map((t) => t.slug),
    tagDetails: tagList,
    team: children.team.map((m) => ({ id: m.id, name: m.name, role: m.role })),
    pastProjects: children.pastProjects.map((p) => ({
      id: p.id,
      name: p.name,
      budget: p.budgetLabel,
      outcome: p.outcome,
      completedAt: p.completedAt,
    })),
    impactMetrics,
    impactStories: children.impactStories.map((s) => ({
      id: s.id,
      title: s.title,
      excerpt: s.excerpt,
      date: s.publishedAt,
      coverFileId: s.coverFileId,
    })),
    certifications: children.certifications.map((c) => ({
      id: c.id,
      name: c.name,
      issued: c.issuedAt,
      expires: c.expiresAt,
      status: c.status,
    })),
    documents: buildDocuments(children.verificationDocs, children.mediaFiles, children.certifications),
    media,
    logoFileId: profile?.logoFileId,
    sectors,
  }

  if (audience === 'public') {
    const { pan, ...publicFields } = base
    return publicFields
  }

  if (audience === 'ngo_admin') {
    return {
      ...base,
      financialTransparency: profile?.financialTransparencyScore,
      riskScore: profile?.riskScore,
      rating: profile?.rating,
      reviewCount: profile?.reviewCount,
      aiRecommended: profile?.aiRecommended,
    }
  }

  return {
    ...base,
    financialTransparency: profile?.financialTransparencyScore ?? 0,
    riskScore: profile?.riskScore ?? 0,
    rating: profile?.rating ?? 0,
    reviewCount: profile?.reviewCount ?? 0,
    aiRecommended: !!profile?.aiRecommended,
  }
}

function loadFullProfile(tenantId, audience = 'corporate') {
  const tenant = db.select().from(tenants).where(eq(tenants.id, tenantId)).get()
  if (!tenant || tenant.type !== 'ngo') return null
  const profile = db.select().from(ngoProfiles).where(eq(ngoProfiles.tenantId, tenantId)).get()
  if (!profile) return null
  const tagList = getEntityTags('ngo', tenantId)
  const children = loadChildRows(tenantId)
  return formatNgoDto({ tenant, profile, tagList, children, audience })
}

export function getProfileByTenantId(tenantId, audience = 'ngo_admin') {
  return loadFullProfile(tenantId, audience)
}

export function getProfileBySlug(slug, { audience = 'corporate', verifiedOnly = false } = {}) {
  const tenant = db.select().from(tenants).where(and(eq(tenants.slug, slug), eq(tenants.type, 'ngo'))).get()
  if (!tenant) return null
  const profile = db.select().from(ngoProfiles).where(eq(ngoProfiles.tenantId, tenant.id)).get()
  if (!profile) return null
  if (verifiedOnly && profile.verificationStatus !== 'verified') return null
  return loadFullProfile(tenant.id, audience)
}

export function listProfiles(filters = {}) {
  const {
    location,
    state,
    verified,
    sdg,
    theme,
    impact,
    tags: tagFilter,
    budgetRange,
    orgSize,
    q,
    limit = 100,
    offset = 0,
    verifiedOnly = false,
    audience = 'corporate',
  } = filters

  const stateFilter = state && state !== 'All' ? state : (location && location !== 'All' ? location : null)

  let tenantIds = db.select({ id: tenants.id })
    .from(tenants)
    .innerJoin(ngoProfiles, eq(ngoProfiles.tenantId, tenants.id))
    .where(eq(tenants.type, 'ngo'))
    .all()
    .map((r) => r.id)

  if (verifiedOnly || verified === 'true' || verified === true) {
    tenantIds = tenantIds.filter((id) => {
      const p = db.select().from(ngoProfiles).where(eq(ngoProfiles.tenantId, id)).get()
      return p?.verificationStatus === 'verified'
    })
  } else if (verified === 'false') {
    tenantIds = tenantIds.filter((id) => {
      const p = db.select().from(ngoProfiles).where(eq(ngoProfiles.tenantId, id)).get()
      return p?.verificationStatus !== 'verified'
    })
  }

  if (stateFilter) {
    const geoSlug = resolveStateGeographySlug(stateFilter)
    let geoMatched = []
    if (geoSlug) {
      geoMatched = findEntitiesByTagGroups('ngo', [[geoSlug]]) || []
    }
    tenantIds = tenantIds.filter((id) => {
      if (geoMatched.includes(id)) return true
      const p = db.select().from(ngoProfiles).where(eq(ngoProfiles.tenantId, id)).get()
      const region = p?.region || ''
      const states = parseJson(p?.statesServed)
      return region === stateFilter || states.includes(stateFilter)
    })
  }

  if (budgetRange && budgetRange !== 'All') {
    tenantIds = tenantIds.filter((id) => {
      const p = db.select().from(ngoProfiles).where(eq(ngoProfiles.tenantId, id)).get()
      return p?.budgetRange === budgetRange
    })
  }

  if (orgSize && orgSize !== 'all') {
    tenantIds = tenantIds.filter((id) => {
      const p = db.select().from(ngoProfiles).where(eq(ngoProfiles.tenantId, id)).get()
      return p?.orgSize === orgSize
    })
  }

  const tagGroups = []
  if (sdg && sdg !== 'all') tagGroups.push([`sdg-${sdg}`])
  const themeSlug = resolveThemeSlug(theme)
  if (themeSlug) tagGroups.push([themeSlug])
  const impactSlug = resolveImpactSlug(impact)
  if (impactSlug) tagGroups.push([impactSlug])
  if (tagFilter) {
    const legacyTags = String(tagFilter).split(',').map((s) => s.trim()).filter(Boolean)
    if (legacyTags.length) tagGroups.push(legacyTags)
  }
  if (tagGroups.length) {
    const matched = findEntitiesByTagGroups('ngo', tagGroups) ?? []
    tenantIds = tenantIds.filter((id) => matched.includes(id))
  }

  if (q?.trim()) {
    const ftsHits = search({ q: q.trim(), types: ['ngo'], limit: 500 })
    const ftsSlugs = new Set(ftsHits.map((h) => h.entityId))
    const ftsTenantIds = db.select({ id: tenants.id, slug: tenants.slug })
      .from(tenants)
      .where(and(eq(tenants.type, 'ngo'), inArray(tenants.slug, [...ftsSlugs])))
      .all()
      .map((r) => r.id)
    const ftsSet = new Set(ftsTenantIds)

    if (ftsSet.size > 0) {
      tenantIds = tenantIds.filter((id) => ftsSet.has(id))
    } else {
      const query = q.trim().toLowerCase()
      tenantIds = tenantIds.filter((id) => {
        const tenant = db.select().from(tenants).where(eq(tenants.id, id)).get()
        const p = db.select().from(ngoProfiles).where(eq(ngoProfiles.tenantId, id)).get()
        return (
          tenant?.name?.toLowerCase().includes(query)
          || p?.description?.toLowerCase().includes(query)
          || p?.region?.toLowerCase().includes(query)
          || p?.primarySector?.toLowerCase().includes(query)
        )
      })
    }
  }

  const total = tenantIds.length
  const slice = tenantIds.slice(Number(offset), Number(offset) + Number(limit))
  const ngos = slice.map((id) => loadFullProfile(id, audience)).filter(Boolean)
  return { ngos, total, limit: Number(limit), offset: Number(offset) }
}

export function reindexNgo(tenantId) {
  const dto = loadFullProfile(tenantId, 'corporate')
  if (!dto) return
  indexDocument({
    tenantId,
    entityType: 'ngo',
    entityId: dto.slug,
    title: dto.name,
    body: [
      dto.description,
      dto.registrationNumber,
      dto.csr1Number,
      dto.pan,
      dto.region,
      ...(dto.statesServed || []),
      ...(dto.districtsServed || []),
      dto.primarySector || dto.sector,
    ].filter(Boolean).join(' '),
    keywords: [
      ...(dto.tags || []),
      dto.sector,
      dto.region,
      ...(dto.focusAreas || []),
      ...(dto.sdgs || []).map((s) => `sdg-${s}`),
    ],
  })
}

function profileScalarsFromInput(data) {
  const now = new Date()
  const out = { updatedAt: now }
  const scalarFields = [
    'registrationNumber', 'contactPerson', 'pan', 'csr1Number', 'website', 'phone', 'email',
    'description', 'settlementType', 'yearsActive', 'beneficiariesCount', 'annualFundingInr',
    'teamSize', 'projectsCount', 'budgetRange', 'orgSize', 'primarySector', 'region',
    'financialTransparencyScore', 'riskScore', 'rating', 'reviewCount', 'logoFileId',
  ]
  for (const key of scalarFields) {
    if (data[key] !== undefined) out[key] = data[key]
  }
  if (data.statesServed !== undefined) out.statesServed = JSON.stringify(data.statesServed)
  if (data.districtsServed !== undefined) out.districtsServed = JSON.stringify(data.districtsServed)
  if (data.sectors !== undefined) out.sectors = JSON.stringify(data.sectors)
  if (data.aiRecommended !== undefined) out.aiRecommended = !!data.aiRecommended
  return out
}

export async function updateProfile(tenantId, data, req) {
  const profile = db.select().from(ngoProfiles).where(eq(ngoProfiles.tenantId, tenantId)).get()
  if (!profile) throw Object.assign(new Error('Profile not found'), { status: 404 })

  const before = loadFullProfile(tenantId, 'ngo_admin')
  const updates = profileScalarsFromInput(data)

  if (data.name) {
    db.update(tenants).set({ name: data.name }).where(eq(tenants.id, tenantId)).run()
  }

  db.update(ngoProfiles).set(updates).where(eq(ngoProfiles.tenantId, tenantId)).run()

  if (data.tagSlugs?.length) {
    const tagRows = db.select().from(tags).where(inArray(tags.slug, data.tagSlugs)).all()
    setEntityTags({
      req,
      entityType: 'ngo',
      entityId: tenantId,
      tenantId,
      tagIds: tagRows.map((t) => t.id),
    })
  }

  const after = loadFullProfile(tenantId, 'ngo_admin')
  if (req) {
    await logMutation({
      req,
      action: 'ngo.profile.update',
      entityType: 'ngo',
      entityId: tenantId,
      before,
      after,
    })
  }
  reindexNgo(tenantId)
  return after
}

export function replaceTeam(tenantId, members, req) {
  const before = db.select().from(ngoTeamMembers).where(eq(ngoTeamMembers.tenantId, tenantId)).all()
  db.delete(ngoTeamMembers).where(eq(ngoTeamMembers.tenantId, tenantId)).run()
  members.forEach((m, i) => {
    db.insert(ngoTeamMembers).values({
      id: newId(),
      tenantId,
      name: m.name,
      role: m.role,
      sortOrder: i,
    }).run()
  })
  const after = db.select().from(ngoTeamMembers).where(eq(ngoTeamMembers.tenantId, tenantId)).all()
  if (req) {
    logMutation({
      req,
      action: 'ngo.team.update',
      entityType: 'ngo',
      entityId: tenantId,
      before,
      after,
    }).catch(() => {})
  }
  return after.map((m) => ({ id: m.id, name: m.name, role: m.role }))
}

export function replacePastProjects(tenantId, projects, req) {
  const before = db.select().from(ngoPastProjects).where(eq(ngoPastProjects.tenantId, tenantId)).all()
  db.delete(ngoPastProjects).where(eq(ngoPastProjects.tenantId, tenantId)).run()
  projects.forEach((p, i) => {
    db.insert(ngoPastProjects).values({
      id: newId(),
      tenantId,
      name: p.name,
      budgetLabel: p.budget || p.budgetLabel,
      outcome: p.outcome,
      completedAt: p.completedAt || null,
      sortOrder: i,
    }).run()
  })
  reindexNgo(tenantId)
  return db.select().from(ngoPastProjects).where(eq(ngoPastProjects.tenantId, tenantId)).all()
}

export function replaceImpactMetrics(tenantId, metrics, req) {
  db.delete(ngoImpactMetrics).where(eq(ngoImpactMetrics.tenantId, tenantId)).run()
  for (const [key, val] of Object.entries(metrics)) {
    db.insert(ngoImpactMetrics).values({
      id: newId(),
      tenantId,
      metricKey: key,
      label: val.label || key,
      value: String(val.value ?? val),
    }).run()
  }
  reindexNgo(tenantId)
  return db.select().from(ngoImpactMetrics).where(eq(ngoImpactMetrics.tenantId, tenantId)).all()
}

export function addImpactStory(tenantId, story) {
  const id = newId()
  db.insert(ngoImpactStories).values({
    id,
    tenantId,
    title: story.title,
    excerpt: story.excerpt || null,
    publishedAt: story.date || story.publishedAt || new Date().toISOString().slice(0, 10),
    coverFileId: story.coverFileId || null,
  }).run()
  return db.select().from(ngoImpactStories).where(eq(ngoImpactStories.id, id)).get()
}

export function updateImpactStory(tenantId, storyId, story) {
  const existing = db.select().from(ngoImpactStories)
    .where(and(eq(ngoImpactStories.id, storyId), eq(ngoImpactStories.tenantId, tenantId)))
    .get()
  if (!existing) return null
  db.update(ngoImpactStories).set({
    title: story.title ?? existing.title,
    excerpt: story.excerpt ?? existing.excerpt,
    publishedAt: story.date ?? story.publishedAt ?? existing.publishedAt,
    coverFileId: story.coverFileId ?? existing.coverFileId,
  }).where(eq(ngoImpactStories.id, storyId)).run()
  return db.select().from(ngoImpactStories).where(eq(ngoImpactStories.id, storyId)).get()
}

export function deleteImpactStory(tenantId, storyId) {
  const existing = db.select().from(ngoImpactStories)
    .where(and(eq(ngoImpactStories.id, storyId), eq(ngoImpactStories.tenantId, tenantId)))
    .get()
  if (!existing) return false
  db.delete(ngoImpactStories).where(eq(ngoImpactStories.id, storyId)).run()
  return true
}

export function addCertification(tenantId, cert) {
  const id = newId()
  db.insert(ngoCertifications).values({
    id,
    tenantId,
    name: cert.name,
    issuedAt: cert.issued || cert.issuedAt || null,
    expiresAt: cert.expires || cert.expiresAt || null,
    status: cert.status || 'active',
  }).run()
  return db.select().from(ngoCertifications).where(eq(ngoCertifications.id, id)).get()
}

export function updateCertification(tenantId, certId, cert) {
  const existing = db.select().from(ngoCertifications)
    .where(and(eq(ngoCertifications.id, certId), eq(ngoCertifications.tenantId, tenantId)))
    .get()
  if (!existing) return null
  db.update(ngoCertifications).set({
    name: cert.name ?? existing.name,
    issuedAt: cert.issued ?? cert.issuedAt ?? existing.issuedAt,
    expiresAt: cert.expires ?? cert.expiresAt ?? existing.expiresAt,
    status: cert.status ?? existing.status,
  }).where(eq(ngoCertifications.id, certId)).run()
  return db.select().from(ngoCertifications).where(eq(ngoCertifications.id, certId)).get()
}

export function deleteCertification(tenantId, certId) {
  const existing = db.select().from(ngoCertifications)
    .where(and(eq(ngoCertifications.id, certId), eq(ngoCertifications.tenantId, tenantId)))
    .get()
  if (!existing) return false
  db.delete(ngoCertifications).where(eq(ngoCertifications.id, certId)).run()
  return true
}

export async function attachMedia({ req, tenantId, tenantType, uploadedBy, buffer, category, originalName, mime }) {
  if (!MEDIA_CATEGORIES.includes(category)) {
    throw Object.assign(new Error(`Invalid media category: ${category}`), { status: 400 })
  }
  const file = await storeFile({
    req,
    buffer,
    tenantId,
    tenantType,
    uploadedBy,
    category,
    originalName,
    mime,
    entityType: 'ngo',
    entityId: tenantId,
  })
  if (category === 'logo') {
    db.update(ngoProfiles).set({ logoFileId: file.id, updatedAt: new Date() })
      .where(eq(ngoProfiles.tenantId, tenantId)).run()
  }
  reindexNgo(tenantId)
  return file
}

export function listMedia(tenantId) {
  return listFiles({ tenantId, entityType: 'ngo', entityId: tenantId })
    .filter((f) => MEDIA_CATEGORIES.includes(f.category))
}

export async function removeMedia(tenantId, fileId) {
  const file = getFileById(fileId, tenantId)
  if (!file || file.entityType !== 'ngo') return false
  const profile = db.select().from(ngoProfiles).where(eq(ngoProfiles.tenantId, tenantId)).get()
  if (profile?.logoFileId === fileId) {
    db.update(ngoProfiles).set({ logoFileId: null, updatedAt: new Date() })
      .where(eq(ngoProfiles.tenantId, tenantId)).run()
  }
  const storage = getStorage()
  await storage.delete(file.storageKey)
  db.delete(files).where(eq(files.id, fileId)).run()
  reindexNgo(tenantId)
  return true
}

export function listDocuments(tenantId) {
  const children = loadChildRows(tenantId)
  return buildDocuments(children.verificationDocs, children.mediaFiles, children.certifications)
}

export function listVerificationQueue() {
  const pending = db.select().from(ngoProfiles)
    .where(eq(ngoProfiles.verificationStatus, 'pending'))
    .all()

  return pending.map((p) => {
    const tenant = db.select().from(tenants).where(eq(tenants.id, p.tenantId)).get()
    const docCount = db.select().from(ngoDocuments).where(eq(ngoDocuments.tenantId, p.tenantId)).all().length
    return {
      tenantId: p.tenantId,
      slug: tenant?.slug,
      name: tenant?.name,
      registrationNumber: p.registrationNumber,
      contactPerson: p.contactPerson,
      submittedAt: p.updatedAt || p.createdAt,
      documentsCount: docCount,
      verificationStatus: p.verificationStatus,
    }
  })
}

export function updatePlatformFields(tenantId, data, req) {
  const profile = db.select().from(ngoProfiles).where(eq(ngoProfiles.tenantId, tenantId)).get()
  if (!profile) throw Object.assign(new Error('NGO not found'), { status: 404 })

  const before = {
    riskScore: profile.riskScore,
    financialTransparencyScore: profile.financialTransparencyScore,
    aiRecommended: profile.aiRecommended,
    rating: profile.rating,
    reviewCount: profile.reviewCount,
  }

  const updates = { updatedAt: new Date() }
  if (data.riskScore !== undefined) updates.riskScore = data.riskScore
  if (data.financialTransparencyScore !== undefined) updates.financialTransparencyScore = data.financialTransparencyScore
  if (data.financialTransparency !== undefined) updates.financialTransparencyScore = data.financialTransparency
  if (data.aiRecommended !== undefined) updates.aiRecommended = !!data.aiRecommended
  if (data.rating !== undefined) updates.rating = data.rating
  if (data.reviewCount !== undefined) updates.reviewCount = data.reviewCount

  db.update(ngoProfiles).set(updates).where(eq(ngoProfiles.tenantId, tenantId)).run()

  if (req) {
    logMutation({
      req,
      action: 'ngo.platform.update',
      entityType: 'ngo',
      entityId: tenantId,
      before,
      after: updates,
    }).catch(() => {})
  }

  return loadFullProfile(tenantId, 'corporate')
}

export function upsertFullProfile(tenantId, data) {
  const now = new Date()
  const existing = db.select().from(ngoProfiles).where(eq(ngoProfiles.tenantId, tenantId)).get()

  const profileData = {
    registrationNumber: data.registrationNumber || `NGO-${tenantId.slice(0, 8)}`,
    sectors: JSON.stringify(data.sectors || [data.primarySector || data.sector || 'General']),
    verificationStatus: data.verificationStatus || (data.verified ? 'verified' : 'pending'),
    contactPerson: data.contactPerson || null,
    pan: data.pan || null,
    csr1Number: data.csr1Number || null,
    website: data.website || null,
    phone: data.phone || null,
    email: data.email || null,
    description: data.description || null,
    statesServed: JSON.stringify(data.statesServed || (data.region ? [data.region] : [])),
    districtsServed: JSON.stringify(data.districtsServed || data.districts || []),
    settlementType: data.settlementType || null,
    yearsActive: data.yearsActive || null,
    beneficiariesCount: data.beneficiariesCount ?? parseBeneficiariesCount(data.beneficiaries),
    annualFundingInr: data.annualFundingInr || null,
    teamSize: data.teamSize || null,
    projectsCount: data.projectsCount ?? data.projects ?? 0,
    budgetRange: data.budgetRange || null,
    orgSize: data.orgSize || null,
    primarySector: data.primarySector || data.sector || null,
    region: data.region || null,
    financialTransparencyScore: data.financialTransparency ?? data.financialTransparencyScore ?? null,
    riskScore: data.riskScore ?? null,
    rating: data.rating ?? null,
    reviewCount: data.reviewCount ?? null,
    aiRecommended: !!data.aiRecommended,
    updatedAt: now,
  }

  if (existing) {
    db.update(ngoProfiles).set(profileData).where(eq(ngoProfiles.tenantId, tenantId)).run()
  } else {
    db.insert(ngoProfiles).values({ tenantId, ...profileData, createdAt: now }).run()
  }

  if (data.team?.length) replaceTeam(tenantId, data.team)
  if (data.pastProjects?.length) replacePastProjects(tenantId, data.pastProjects)
  if (data.impactMetrics) replaceImpactMetrics(tenantId, data.impactMetrics)

  if (data.certifications?.length) {
    db.delete(ngoCertifications).where(eq(ngoCertifications.tenantId, tenantId)).run()
    for (const c of data.certifications) addCertification(tenantId, c)
  }

  if (data.impactStories?.length) {
    db.delete(ngoImpactStories).where(eq(ngoImpactStories.tenantId, tenantId)).run()
    for (const s of data.impactStories) addImpactStory(tenantId, s)
  }

  if (data.tagSlugs?.length) {
    const tagRows = db.select().from(tags).where(inArray(tags.slug, data.tagSlugs)).all()
    setEntityTags({
      entityType: 'ngo',
      entityId: tenantId,
      tenantId,
      tagIds: tagRows.map((t) => t.id),
      skipActivity: true,
    })
  }

  reindexNgo(tenantId)
}

function parseBeneficiariesCount(str) {
  if (typeof str === 'number') return str
  if (!str) return 0
  const m = String(str).replace(/,/g, '').match(/(\d+)/)
  return m ? parseInt(m[1], 10) * (String(str).includes('+') && parseInt(m[1], 10) < 100 ? 1000 : 1) : 0
}
