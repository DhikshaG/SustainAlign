// Mirror of frontend sample data for API stubs (Phase 1)
export const dashboardSummary = {
  budget: { total: 25000000, allocated: 18750000, spent: 14200000 },
  activeProjects: { count: 14 },
  complianceScore: 87,
  notificationCount: 5,
}

export const ngos = [
  {
    slug: 'green-earth-foundation',
    name: 'Green Earth Foundation',
    region: 'Maharashtra',
    verified: true,
    sdgs: [13, 15, 6],
    csrThemes: ['Environment'],
    budgetRange: '50L-1Cr',
    orgSize: 'large',
    rating: 4.8,
    riskScore: 12,
    aiRecommended: true,
  },
  {
    slug: 'edu-rise-india',
    name: 'EduRise India',
    region: 'Karnataka',
    verified: true,
    sdgs: [4, 10],
    csrThemes: ['Education'],
    budgetRange: '25L-50L',
    orgSize: 'medium',
    rating: 4.6,
    riskScore: 8,
    aiRecommended: true,
  },
  {
    slug: 'health-for-all-trust',
    name: 'Health For All Trust',
    region: 'Tamil Nadu',
    verified: true,
    sdgs: [3, 1],
    csrThemes: ['Healthcare'],
    budgetRange: '1Cr+',
    orgSize: 'large',
    rating: 4.9,
    riskScore: 15,
    aiRecommended: true,
  },
  {
    slug: 'skill-build-foundation',
    name: 'SkillBuild Foundation',
    region: 'Rajasthan',
    verified: true,
    sdgs: [8],
    csrThemes: ['Livelihood'],
    budgetRange: '10L-25L',
    orgSize: 'small',
    rating: 4.2,
    riskScore: 22,
    aiRecommended: false,
  },
  {
    slug: 'clean-water-mission',
    name: 'Clean Water Mission',
    region: 'Odisha',
    verified: true,
    sdgs: [6],
    csrThemes: ['Environment'],
    budgetRange: '25L-50L',
    orgSize: 'medium',
    rating: 4.5,
    riskScore: 10,
    aiRecommended: false,
  },
]

export const projects = [
  {
    id: 'proj-001',
    name: 'Green Maharashtra Afforestation',
    ngoName: 'Green Earth Foundation',
    status: 'active',
    budget: 4500000,
    theme: 'Environment',
    progress: 72,
  },
  {
    id: 'proj-002',
    name: 'Digital Classrooms Karnataka',
    ngoName: 'EduRise India',
    status: 'active',
    budget: 2800000,
    theme: 'Education',
    progress: 45,
  },
  {
    id: 'proj-003',
    name: 'Mobile Health Tamil Nadu',
    ngoName: 'Health For All Trust',
    status: 'active',
    budget: 3200000,
    theme: 'Healthcare',
    progress: 88,
  },
]

export const complianceSummary = {
  section135: { csrObligation: 9000000, fy: 'FY 2025-26' },
  spend: { spent: 14200000, unspent: 10800000 },
  auditReadiness: { score: 78 },
}

export const reportingOverview = {
  impactSummary: { totalBeneficiaries: 285000, projectsActive: 14, sdgsCovered: 8 },
}

export const fundAllocation = {
  totalBudget: 25000000,
  themes: [
    { name: 'Healthcare', allocated: 6250000, spent: 4100000 },
    { name: 'Education', allocated: 5000000, spent: 3200000 },
  ],
}

export const volunteerCampaigns = { summary: { campaigns: 6, volunteers: 342 } }
export const documents = { count: 6 }
export const communications = { threads: 3, unread: 3 }
export const copilotSuggestions = ['What is my CSR obligation for FY25?', 'Suggest NGOs for education in Karnataka']

export function getNgo(slug) {
  return ngos.find((n) => n.slug === slug)
}

export function getProject(id) {
  return projects.find((p) => p.id === id)
}

export function filterNgos(query) {
  let result = [...ngos]
  if (query.location && query.location !== 'All') {
    result = result.filter((n) => n.region === query.location)
  }
  if (query.verified === 'true') {
    result = result.filter((n) => n.verified)
  }
  if (query.sdg && query.sdg !== 'all') {
    result = result.filter((n) => n.sdgs.includes(Number(query.sdg)))
  }
  return result
}
