export const THEME_TO_SDG = {
  Healthcare: { sdg: 3, label: 'Good Health' },
  Education: { sdg: 4, label: 'Quality Education' },
  Environment: { sdg: 13, label: 'Climate Action' },
  Livelihood: { sdg: 8, label: 'Decent Work' },
  'Rural Development': { sdg: 1, label: 'No Poverty' },
  'Clean Water': { sdg: 6, label: 'Clean Water' },
  'Women Empowerment': { sdg: 5, label: 'Gender Equality' },
}

export const SCHEDULE_VII_TO_THEME = {
  'Promoting education': 'Education',
  'Promoting health care': 'Healthcare',
  'Ensuring environmental sustainability': 'Environment',
  'Eradicating hunger, poverty and malnutrition': 'Rural Development',
  'Promoting gender equality and empowering women': 'Women Empowerment',
  'Ensuring availability of safe drinking water': 'Clean Water',
}

const THEME_TO_PILLAR = {
  Environment: 'environmental',
  Healthcare: 'social',
  Education: 'social',
  Livelihood: 'social',
  'Rural Development': 'social',
  'Clean Water': 'social',
  'Women Empowerment': 'social',
  Other: 'social',
}

const THEME_TO_BRSR = {
  Environment: [6],
  Healthcare: [5, 9],
  Education: [8],
  Livelihood: [8],
  'Rural Development': [8],
  'Clean Water': [6, 9],
  'Women Empowerment': [5, 8],
}

export const BRSR_PRINCIPLES = [
  { id: 1, title: 'Ethics, Transparency and Accountability', description: 'Governance, ethics, and transparent business conduct' },
  { id: 2, title: 'Products/Services for Sustainable Value', description: 'Sustainable products and services across the value chain' },
  { id: 3, title: 'Well-being of Employees', description: 'Employee welfare, safety, and development' },
  { id: 4, title: 'Stakeholder Engagement', description: 'Engagement with stakeholders on material issues' },
  { id: 5, title: 'Human Rights', description: 'Respect and promotion of human rights' },
  { id: 6, title: 'Environment', description: 'Environmental stewardship and climate action' },
  { id: 7, title: 'Public Policy Advocacy', description: 'Responsible public and regulatory policy engagement' },
  { id: 8, title: 'Inclusive Growth and Equitable Development', description: 'Inclusive growth and community development' },
  { id: 9, title: 'Customer Value', description: 'Responsible customer engagement and value' },
]

export const KPI_CATALOG = {
  co2_offset_tons: { pillar: 'environmental', label: 'CO₂ Offset', unit: 'tons', sdg: 13, brsrPrinciple: 6 },
  saplings_planted: { pillar: 'environmental', label: 'Saplings Planted', unit: 'count', sdg: 13, brsrPrinciple: 6 },
  classrooms: { pillar: 'social', label: 'Digital Classrooms', unit: 'centers', sdg: 4, brsrPrinciple: 8 },
  patients_served: { pillar: 'social', label: 'Patients Served', unit: 'count', sdg: 3, brsrPrinciple: 9 },
  health_camps: { pillar: 'social', label: 'Health Camps', unit: 'count', sdg: 3, brsrPrinciple: 9 },
}

export function mapThemeToPillar(theme) {
  return THEME_TO_PILLAR[theme] || 'social'
}

export function mapProject(project) {
  const theme = project.theme || 'Other'
  const sdgInfo = THEME_TO_SDG[theme]
  return {
    pillar: mapThemeToPillar(theme),
    sdg: sdgInfo?.sdg ?? null,
    sdgLabel: sdgInfo?.label ?? null,
    brsrPrinciples: THEME_TO_BRSR[theme] || [],
    scheduleVII: project.scheduleVii || null,
    theme,
  }
}

export function mapKpi(metricKey) {
  const entry = KPI_CATALOG[metricKey]
  if (!entry) {
    return { pillar: 'social', label: metricKey, unit: null, sdg: null, brsrPrinciple: null }
  }
  return { ...entry, key: metricKey }
}

export function sdgLabelFor(sdg) {
  const entry = Object.values(THEME_TO_SDG).find((s) => s.sdg === sdg)
  return entry?.label || `SDG ${sdg}`
}
