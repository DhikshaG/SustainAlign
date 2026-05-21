import { aggregateForTenant, getReportingOverview } from '../impact/index.js'
import { getComplianceSummary } from '../compliance/index.js'

export function getDashboardSummary(corporateTenantId) {
  const agg = aggregateForTenant(corporateTenantId)
  let complianceScore = 78
  let deadlines = []
  try {
    const compliance = getComplianceSummary(corporateTenantId)
    complianceScore = compliance.auditReadiness?.score ?? compliance.complianceScore ?? 78
    deadlines = (compliance.dueDates || []).slice(0, 4).map((d, i) => ({
      id: d.id ?? i + 1,
      title: d.title,
      date: d.date,
      type: d.status === 'overdue' ? 'document' : 'regulatory',
      urgent: d.status === 'overdue',
    }))
  } catch {
    // compliance tables may not exist yet during partial migrations
  }
  return {
    ...agg.dashboard,
    complianceScore,
    deadlines,
    aiRecommendations: [],
  }
}

export { getReportingOverview }
