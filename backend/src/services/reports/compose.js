import { TYPE_TITLES, SECTION_ORDER } from './templates.js'

function fmtInr(n) {
  return `₹${(n || 0).toLocaleString('en-IN')}`
}

function buildDeterministicSections(type, context) {
  const { aggregate, compliance, projects, sdgProgress, districtAnalytics, budget, allUpdates, impactStories } = context
  const sections = []

  const impactBody = [
    `Total Beneficiaries: ${aggregate.impactSummary.totalBeneficiaries.toLocaleString('en-IN')}`,
    `Active Projects: ${aggregate.impactSummary.projectsActive}`,
    `SDGs Covered: ${aggregate.impactSummary.sdgsCovered}`,
    `CO₂ Offset (tons): ${aggregate.impactSummary.co2Offset}`,
  ].join('\n')

  sections.push({
    id: 'impact_summary',
    heading: 'Impact Summary',
    body: impactBody,
  })

  if (['executive', 'quarterly', 'board'].includes(type)) {
    sections.push({
      id: 'impact_highlights',
      heading: 'Impact Highlights',
      body: districtAnalytics.slice(0, 5).map((d) =>
        `${d.district}: ${d.beneficiaries.toLocaleString('en-IN')} beneficiaries, ${fmtInr(d.spend)} spend`,
      ).join('\n') || 'No district data for this period.',
    })
  }

  if (['executive', 'quarterly', 'board'].includes(type)) {
    sections.push({
      id: 'budget_snapshot',
      heading: 'Budget Snapshot',
      body: [
        `Total CSR Budget: ${fmtInr(budget.total)}`,
        `Allocated: ${fmtInr(budget.allocated)}`,
        `Spent: ${fmtInr(budget.spent)}`,
        `FY CSR Obligation: ${fmtInr(compliance.section135.csrObligation)}`,
        `Compliance Spent: ${fmtInr(compliance.spend.spent)}`,
        `Unspent: ${fmtInr(compliance.spend.unspent)}`,
      ].join('\n'),
    })
  }

  if (['executive', 'quarterly', 'board', 'sdg'].includes(type)) {
    const sdgLines = (sdgProgress.length ? sdgProgress : aggregate.sdgMapping).map((s) =>
      `SDG ${s.sdg} ${s.label}: ${s.projects} project(s), ${(s.beneficiaries ?? 0).toLocaleString('en-IN')} beneficiaries, ${fmtInr(s.spend)}`,
    )
    sections.push({
      id: 'sdg_mapping',
      heading: 'SDG Overview',
      body: sdgLines.join('\n') || 'No SDG data yet.',
    })
  }

  if (['quarterly', 'board', 'mca_csr2'].includes(type)) {
    sections.push({
      id: 'compliance',
      heading: 'Compliance (Section 135)',
      body: [
        `FY: ${compliance.section135.fy}`,
        `Eligible: ${compliance.section135.eligible ? 'Yes' : 'No'}`,
        `Formula: ${compliance.section135.obligationBreakdown?.formula || 'N/A'}`,
        `CSR Obligation (2%): ${fmtInr(compliance.section135.csrObligation)}`,
        `Total Spent: ${fmtInr(compliance.spend.spent)}`,
        `Unspent: ${fmtInr(compliance.spend.unspent)}`,
      ].join('\n'),
    })
  }

  if (type === 'mca_csr2' || type === 'board') {
    sections.push({
      id: 'schedule_vii',
      heading: 'Schedule VII Validation',
      body: compliance.scheduleVIIValidation
        .map((v) => `${v.item}: ${v.status}${v.note ? ` (${v.note})` : ''}`)
        .join('\n') || 'No validation data.',
    })
    sections.push({
      id: 'spend_breakdown',
      heading: 'Schedule VII Spend Breakdown',
      body: compliance.spend.breakdown
        .map((b) => `${b.category} | ${b.scheduleVII} | ${fmtInr(b.amount)}`)
        .join('\n') || 'No spend data.',
    })
  }

  if (['quarterly', 'board'].includes(type)) {
    const kpiRows = projects.flatMap((p) =>
      p.kpis.map((k) => [p.name, k.label, `${k.value}${k.unit ? ` ${k.unit}` : ''}`]),
    )
    sections.push({
      id: 'kpi_table',
      heading: 'KPI Metrics',
      body: kpiRows.length ? kpiRows.map((r) => r.join(' — ')).join('\n') : 'No KPIs recorded in this period.',
      table: kpiRows.length ? { headers: ['Project', 'Metric', 'Value'], rows: kpiRows } : undefined,
    })

    const updateLines = allUpdates.slice(0, 15).map((u) =>
      `${u.date} · ${u.projectName} · ${u.author}: ${u.body.slice(0, 120)}${u.body.length > 120 ? '…' : ''}`,
    )
    sections.push({
      id: 'updates_timeline',
      heading: 'Impact Updates',
      body: updateLines.join('\n') || 'No project updates in this period.',
      bullets: updateLines,
    })
  }

  if (type === 'impact_stories') {
    const storyBullets = impactStories.slice(0, 8).map((s) =>
      `${s.title} (${s.ngoName}): ${s.excerpt || 'No excerpt'}`,
    )
    sections.push({
      id: 'ngo_stories',
      heading: 'NGO Impact Stories',
      body: storyBullets.join('\n\n') || 'No NGO impact stories on file.',
      bullets: storyBullets,
    })

    const vignettes = projects.slice(0, 5).map((p) => {
      const ben = p.beneficiaryLogs.reduce((s, l) => s + l.direct + l.indirect, 0)
      const latestUpdate = p.updates[0]?.body
      return `${p.name} (${p.ngoName}): ${p.progress}% complete, ${ben} beneficiaries logged in period.${latestUpdate ? ` Latest update: ${latestUpdate.slice(0, 100)}` : ''}`
    })
    sections.push({
      id: 'project_vignettes',
      heading: 'Project Vignettes',
      body: vignettes.join('\n\n') || 'No project activity in this period.',
      bullets: vignettes,
    })
  }

  if (['board', 'quarterly'].includes(type)) {
    const perf = aggregate.ngoPerformance.slice(0, 5)
      .map((n) => `${n.ngo}: score ${n.score}, on-time ${n.onTime}%, impact ${n.impact}%`)
    sections.push({
      id: 'ngo_performance',
      heading: 'NGO Performance',
      body: perf.join('\n') || 'No performance data.',
      bullets: perf,
    })
  }

  if (type === 'board') {
    sections.push({
      id: 'key_metrics',
      heading: 'Key Metrics',
      body: [
        `Beneficiaries: ${aggregate.impactSummary.totalBeneficiaries.toLocaleString('en-IN')}`,
        `Active Projects: ${aggregate.impactSummary.projectsActive}`,
        `Budget Utilization: ${budget.total ? Math.round((budget.spent / budget.total) * 100) : 0}%`,
        `Audit Readiness: ${compliance.auditReadiness?.score ?? 'N/A'}/100`,
      ].join('\n'),
    })
  }

  const projLines = projects.slice(0, 10)
    .map((p) => `${p.name} — ${p.ngoName || 'NGO'} — ${p.progress}% — ${fmtInr(p.spentInr)} spent`)
  sections.push({
    id: 'projects',
    heading: 'Projects',
    body: projLines.join('\n') || 'No projects.',
    bullets: projLines,
  })

  return sections
}

function orderSections(type, sections, aiContent) {
  const order = SECTION_ORDER[type] || SECTION_ORDER.quarterly
  const byId = new Map(sections.map((s) => [s.id, s]))
  const result = []

  if (aiContent?.executiveSummary) {
    result.push({
      id: 'executive_summary',
      heading: 'Executive Summary',
      body: aiContent.executiveSummary,
    })
  }

  if (aiContent?.impactStories?.length && (type === 'impact_stories' || type === 'quarterly' || type === 'board')) {
    const storyBody = aiContent.impactStories
      .map((s) => `${s.title}\n${s.body}`)
      .join('\n\n')
    result.push({
      id: 'impact_stories',
      heading: 'Impact Stories',
      body: storyBody,
      bullets: aiContent.impactStories.map((s) => `${s.title}: ${s.body.slice(0, 120)}…`),
    })
  }

  for (const id of order) {
    if (id === 'executive_summary' && aiContent?.executiveSummary) continue
    if (id === 'impact_stories' && aiContent?.impactStories?.length) continue
    const sec = byId.get(id)
    if (sec) result.push(sec)
  }

  for (const sec of sections) {
    if (!result.find((r) => r.id === sec.id)) result.push(sec)
  }

  return result
}

export async function composeReportContent(context, type, { includeAi = true } = {}) {
  const title = TYPE_TITLES[type] || 'CSR Report'
  let aiContent = null
  let aiGenerated = false
  let offline = false

  if (includeAi && ['executive', 'impact_stories', 'quarterly', 'board'].includes(type)) {
    const { generateReportContent } = await import('../ai/context.js')
    const aiResult = await generateReportContent(context.tenantId, context, type)
    aiContent = aiResult.content
    aiGenerated = aiResult.aiGenerated
    offline = aiResult.offline
  }

  const deterministic = buildDeterministicSections(type, context)
  const sections = orderSections(type, deterministic, aiContent)

  return {
    title,
    tenantName: context.tenantName,
    periodStart: context.periodStart,
    periodEnd: context.periodEnd,
    type,
    sections,
    aiGenerated,
    offline,
  }
}

export async function previewReport(corporateTenantId, { type, periodStart, periodEnd, includeAi = true }) {
  const { buildReportContext } = await import('./context.js')
  const context = buildReportContext(corporateTenantId, { periodStart, periodEnd })
  return composeReportContent(context, type, { includeAi })
}
