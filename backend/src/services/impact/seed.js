import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { csrProjects, projectKpis } from '../../db/schema.js'
import { addKpi, addBeneficiaryLog, addGeoUpdate } from './index.js'

const IMPACT_SEED = [
  {
    projectId: 'proj-001',
    state: 'Maharashtra',
    kpis: [
      { metricKey: 'co2_offset_tons', label: 'COÃƒÂ¢Ã¢â‚¬Å¡Ã¢â‚¬Å¡ Offset', value: '8400', unit: 'tons' },
      { metricKey: 'saplings_planted', label: 'Saplings Planted', value: '820000', unit: 'count' },
    ],
    beneficiaries: { directCount: 45000, indirectCount: 120000, note: 'Village communities in Pune & Nashik' },
    geo: { state: 'Maharashtra', district: 'Pune', lat: 18.5204, lng: 73.8567 },
  },
  {
    projectId: 'proj-002',
    state: 'Karnataka',
    kpis: [{ metricKey: 'classrooms', label: 'Digital Classrooms', value: '12', unit: 'centers' }],
    beneficiaries: { directCount: 3200, indirectCount: 8500, note: 'Students in rural Karnataka' },
    geo: { state: 'Karnataka', district: 'Bengaluru Rural', lat: 12.9716, lng: 77.5946 },
  },
  {
    projectId: 'proj-003',
    state: 'Tamil Nadu',
    kpis: [
      { metricKey: 'patients_served', label: 'Patients Served', value: '88000', unit: 'count' },
      { metricKey: 'health_camps', label: 'Health Camps', value: '520', unit: 'count' },
    ],
    beneficiaries: { directCount: 88000, indirectCount: 150000, note: 'Primary care beneficiaries' },
    geo: { state: 'Tamil Nadu', district: 'Madurai', lat: 9.9252, lng: 78.1198 },
  },
]

export async function seedImpact() {
  let seeded = 0
  for (const item of IMPACT_SEED) {
    const project = await db.select().from(csrProjects).where(eq(csrProjects.id, item.projectId)).get()
    if (!project) continue

    const existingKpi = await db.select().from(projectKpis).where(eq(projectKpis.projectId, item.projectId)).get()
    if (existingKpi) continue

    await db
      .update(csrProjects)
      .set({ state: item.state, updatedAt: new Date() })
      .where(eq(csrProjects.id, item.projectId))
      .run()

    for (const kpi of item.kpis) {
      addKpi(item.projectId, kpi, { corporateTenantId: project.corporateTenantId })
      seeded++
    }
    addBeneficiaryLog(item.projectId, item.beneficiaries, { corporateTenantId: project.corporateTenantId })
    addGeoUpdate(item.projectId, item.geo, { corporateTenantId: project.corporateTenantId })
    seeded++
  }
  console.log(`  impact  ${seeded} KPI/beneficiary/geo records`)
}
