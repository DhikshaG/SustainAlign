import { ngos as baseNgos } from '../sample-ngos'

const enrichments = {
  'green-earth-foundation': {
    sdgs: [13, 15, 6],
    csrThemes: ['Environment', 'Rural Development'],
    budgetRange: '50L-1Cr',
    orgSize: 'large',
    csr1Number: 'CSR/2020/MH/1042',
    riskScore: 12,
    rating: 4.8,
    reviewCount: 34,
    financialTransparency: 92,
    districts: ['Pune', 'Nashik', 'Ahmednagar'],
    team: [
      { name: 'Priya Sharma', role: 'Executive Director' },
      { name: 'Rajesh Kulkarni', role: 'Program Head' },
    ],
    documents: [
      { name: '80G Certificate', type: 'tax', uploaded: '2025-01-15' },
      { name: 'Annual Report FY24', type: 'report', uploaded: '2025-03-01' },
    ],
    pastProjects: [
      { name: 'Green Maharashtra 2024', budget: '₹45L', outcome: '2M trees planted' },
      { name: 'Water for Villages', budget: '₹32L', outcome: '120 check dams' },
    ],
    impactMetrics: { treesPlanted: 2000000, waterBodiesRestored: 120, villagesReached: 85 },
  },
  'edu-rise-india': {
    sdgs: [4, 10],
    csrThemes: ['Education', 'Gender Equality'],
    budgetRange: '25L-50L',
    orgSize: 'medium',
    csr1Number: 'CSR/2019/KA/0881',
    riskScore: 8,
    rating: 4.6,
    reviewCount: 28,
    financialTransparency: 88,
    districts: ['Bangalore Rural', 'Mysuru', 'Tumkur'],
    team: [
      { name: 'Anita Desai', role: 'Founder & CEO' },
      { name: 'Suresh Rao', role: 'Operations Director' },
    ],
    documents: [
      { name: '12A Registration', type: 'legal', uploaded: '2024-11-20' },
      { name: 'FCRA Certificate', type: 'legal', uploaded: '2025-02-10' },
    ],
    pastProjects: [
      { name: 'Digital Classrooms', budget: '₹28L', outcome: '150 centers' },
    ],
    impactMetrics: { studentsReached: 25000, teachersTrained: 450, digitalCenters: 150 },
  },
  'health-for-all-trust': {
    sdgs: [3, 1],
    csrThemes: ['Healthcare', 'Poverty Alleviation'],
    budgetRange: '1Cr+',
    orgSize: 'large',
    csr1Number: 'CSR/2018/TN/0234',
    riskScore: 15,
    rating: 4.9,
    reviewCount: 52,
    financialTransparency: 95,
    districts: ['Chennai', 'Coimbatore', 'Madurai', 'Trichy'],
    team: [
      { name: 'Dr. Lakshmi Iyer', role: 'Medical Director' },
      { name: 'Karthik Menon', role: 'Program Manager' },
    ],
    documents: [
      { name: 'Utilization Certificate Q3', type: 'compliance', uploaded: '2025-01-05' },
    ],
    pastProjects: [
      { name: 'Mobile Health Units', budget: '₹85L', outcome: '500 camps' },
    ],
    impactMetrics: { patientsServed: 100000, mobileClinics: 12, healthCamps: 500 },
  },
}

function defaultEnrichment(ngo) {
  return {
    sdgs: [1, 3, 4],
    csrThemes: [ngo.sector],
    budgetRange: '10L-25L',
    orgSize: 'small',
    csr1Number: `CSR/2021/${ngo.region.slice(0, 2).toUpperCase()}/${Math.floor(Math.random() * 9000 + 1000)}`,
    riskScore: ngo.verified ? 18 : 35,
    rating: ngo.verified ? 4.2 + Math.random() * 0.6 : 3.5,
    reviewCount: Math.floor(Math.random() * 30 + 5),
    financialTransparency: ngo.verified ? 75 + Math.floor(Math.random() * 20) : 55,
    districts: [ngo.region],
    team: [{ name: 'Program Lead', role: 'Director' }],
    documents: [{ name: 'Registration Certificate', type: 'legal', uploaded: '2024-06-01' }],
    pastProjects: [{ name: `${ngo.sector} Initiative`, budget: '₹15L', outcome: 'Ongoing' }],
    impactMetrics: { beneficiaries: ngo.beneficiaries, projectsCompleted: ngo.projects },
  }
}

export const corporateNgos = baseNgos.map((ngo) => ({
  ...ngo,
  ...(enrichments[ngo.slug] || defaultEnrichment(ngo)),
  aiRecommended: ['green-earth-foundation', 'health-for-all-trust', 'edu-rise-india'].includes(ngo.slug),
}))

export const discoveryFilters = {
  locations: ['All', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Rajasthan', 'Delhi NCR', 'Bihar', 'Gujarat', 'Pan-India', 'Kerala', 'Odisha'],
  sdgs: [
    { value: 'all', label: 'All SDGs' },
    { value: '1', label: 'SDG 1 - No Poverty' },
    { value: '3', label: 'SDG 3 - Good Health' },
    { value: '4', label: 'SDG 4 - Quality Education' },
    { value: '6', label: 'SDG 6 - Clean Water' },
    { value: '10', label: 'SDG 10 - Reduced Inequalities' },
    { value: '13', label: 'SDG 13 - Climate Action' },
    { value: '15', label: 'SDG 15 - Life on Land' },
  ],
  csrThemes: ['All', 'Education', 'Healthcare', 'Environment', 'Livelihood', 'Women Empowerment', 'Rural Development', 'Disaster Relief'],
  budgetRanges: ['All', 'Under 10L', '10L-25L', '25L-50L', '50L-1Cr', '1Cr+'],
  orgSizes: [
    { value: 'all', label: 'All sizes' },
    { value: 'small', label: 'Small (<50 staff)' },
    { value: 'medium', label: 'Medium (50-200)' },
    { value: 'large', label: 'Large (200+)' },
  ],
}

export function getCorporateNgo(slug) {
  return corporateNgos.find((n) => n.slug === slug)
}
