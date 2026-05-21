import { aggregateForTenant, getReportingOverview } from '../impact/index.js'
import { getComplianceSummary } from '../compliance/index.js'
import { getTopRecommendationsSync } from '../matching/index.js'
import { getVolunteerSummary } from '../volunteers/index.js'

export function getDashboardSummary(corporateTenantId) {
  const agg = aggregateForTenant(corporateTenantId)
  let complianceScore = 78
  let deadlines = []
  let aiRecommendations = []
  let volunteering = { hoursLogged: 0, activeEvents: 0, volunteersCount: 0 }
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
  try {
    aiRecommendations = getTopRecommendationsSync(corporateTenantId, 3)
  } catch {
    aiRecommendations = []
  }
  try {
    const v = getVolunteerSummary(corporateTenantId)
    volunteering = {
      hoursLogged: v.hoursLogged,
      activeEvents: v.activeEvents,
      volunteersCount: v.volunteers,
    }
  } catch {
    volunteering = { hoursLogged: 0, activeEvents: 0, volunteersCount: 0 }
  }
  return {
    ...agg.dashboard,
    complianceScore,
    deadlines,
    aiRecommendations,
    volunteering,
  }
}

export { getReportingOverview }
