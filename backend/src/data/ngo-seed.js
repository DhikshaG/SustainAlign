/** Full NGO records for dev seed — mirrors frontend sample-ngos + corporate enrichments. */

const REGION_TAG = {
  Maharashtra: 'maharashtra',
  Karnataka: 'karnataka',
  'Tamil Nadu': 'tamil-nadu',
  Rajasthan: 'rajasthan',
  'Delhi NCR': 'delhi-ncr',
  Bihar: 'bihar',
  Gujarat: 'gujarat',
  'Pan-India': 'pan-india',
  Kerala: 'kerala',
  Odisha: 'odisha',
}

const THEME_TAG = {
  Education: 'education',
  Healthcare: 'healthcare',
  Environment: 'environment',
  'Rural Development': 'rural-development',
  Livelihood: 'livelihood',
  'Women Empowerment': 'women-empowerment',
  'Disaster Relief': 'disaster-relief',
  'Child Welfare': 'child-welfare',
  'Poverty Alleviation': 'sdg-1',
  'Gender Equality': 'sdg-5',
}

const IMPACT_TAG = {
  Environment: 'climate',
  'Child Welfare': 'child-welfare',
  Livelihood: 'livelihood',
  'Rural Development': 'livelihood',
  'Women Empowerment': 'livelihood',
}

function inferImpactFromFocus(focusAreas = []) {
  const slugs = new Set()
  for (const area of focusAreas) {
    const lower = area.toLowerCase()
    if (lower.includes('climate') || lower.includes('afforestation')) slugs.add('climate')
    if (lower.includes('water') || lower.includes('sanitation')) slugs.add('water-sanitation')
    if (lower.includes('child')) slugs.add('child-welfare')
    if (
      lower.includes('vocational')
      || lower.includes('agriculture')
      || lower.includes('micro-enterprise')
      || lower.includes('livelihood')
    ) {
      slugs.add('livelihood')
    }
  }
  return [...slugs]
}

function buildTagSlugs({ sdgs = [], csrThemes = [], region, sector, focusAreas = [] }) {
  const slugs = new Set()
  for (const s of sdgs) slugs.add(`sdg-${s}`)
  if (REGION_TAG[region]) slugs.add(REGION_TAG[region])
  for (const t of csrThemes) {
    if (THEME_TAG[t]) slugs.add(THEME_TAG[t])
  }
  if (THEME_TAG[sector]) slugs.add(THEME_TAG[sector])
  if (IMPACT_TAG[sector]) slugs.add(IMPACT_TAG[sector])
  for (const impact of inferImpactFromFocus(focusAreas)) slugs.add(impact)
  return [...slugs]
}

function defaultEnrichment(ngo) {
  return {
    sdgs: [1, 3, 4],
    csrThemes: [ngo.sector],
    budgetRange: '10L-25L',
    orgSize: 'small',
    csr1Number: `CSR/2021/${ngo.region.slice(0, 2).toUpperCase()}/${1000 + ngo.slug.length * 111}`,
    riskScore: ngo.verified ? 18 : 35,
    rating: ngo.verified ? 4.4 : 3.5,
    reviewCount: 12,
    financialTransparency: ngo.verified ? 82 : 55,
    districts: [ngo.region],
    team: [{ name: 'Program Lead', role: 'Director' }],
    pastProjects: [{ name: `${ngo.sector} Initiative`, budget: '₹15L', outcome: 'Ongoing impact delivery' }],
    impactMetrics: { beneficiariesReached: ngo.beneficiariesCount ?? 10000, projectsCompleted: ngo.projects ?? 1 },
    aiRecommended: false,
  }
}

const BASE = [
  {
    slug: 'green-earth-foundation',
    name: 'Green Earth Foundation',
    sector: 'Environment',
    region: 'Maharashtra',
    verified: true,
    description: 'Leading environmental NGO focused on afforestation, water conservation, and climate resilience in rural Maharashtra.',
    focusAreas: ['Afforestation', 'Water Conservation', 'Climate Adaptation'],
    beneficiaries: '50,000+',
    projects: 12,
    beneficiariesCount: 50000,
    contactPerson: 'Priya Sharma',
    email: 'admin@greenearth.org',
    registrationNumber: 'NGO-12345',
  },
  {
    slug: 'edu-rise-india',
    name: 'EduRise India',
    sector: 'Education',
    region: 'Karnataka',
    verified: true,
    description: 'Transforming rural education through digital learning centers and teacher training programs.',
    focusAreas: ['Digital Literacy', 'Teacher Training', 'Scholarships'],
    beneficiaries: '25,000+',
    projects: 8,
    beneficiariesCount: 25000,
    contactPerson: 'Anita Desai',
    email: 'contact@edurise.org',
  },
  {
    slug: 'health-for-all-trust',
    name: 'Health For All Trust',
    sector: 'Healthcare',
    region: 'Tamil Nadu',
    verified: true,
    description: 'Providing primary healthcare access to underserved communities through mobile clinics and health camps.',
    focusAreas: ['Primary Healthcare', 'Maternal Health', 'Preventive Care'],
    beneficiaries: '100,000+',
    projects: 15,
    beneficiariesCount: 100000,
    contactPerson: 'Dr. Lakshmi Iyer',
    email: 'info@healthforall.org',
  },
  {
    slug: 'skill-build-foundation',
    name: 'SkillBuild Foundation',
    sector: 'Livelihood',
    region: 'Rajasthan',
    verified: true,
    description: 'Vocational training and entrepreneurship support for youth and women in semi-urban areas.',
    focusAreas: ['Vocational Training', 'Micro-enterprise', 'Women Empowerment'],
    beneficiaries: '15,000+',
    projects: 6,
    beneficiariesCount: 15000,
    contactPerson: 'Vikram Singh',
    email: 'hello@skillbuild.org',
  },
  {
    slug: 'child-hope-initiative',
    name: 'Child Hope Initiative',
    sector: 'Child Welfare',
    region: 'Delhi NCR',
    verified: true,
    description: 'Nutrition, education, and protection programs for vulnerable children in urban slums.',
    focusAreas: ['Nutrition', 'Education', 'Child Protection'],
    beneficiaries: '8,000+',
    projects: 5,
    beneficiariesCount: 8000,
    contactPerson: 'Meera Kapoor',
    email: 'reach@childhope.org',
  },
  {
    slug: 'rural-livelihoods-network',
    name: 'Rural Livelihoods Network',
    sector: 'Rural Development',
    region: 'Bihar',
    verified: false,
    description: 'Agriculture modernization and farmer producer organization support across Bihar.',
    focusAreas: ['Agriculture', 'FPO Support', 'Market Linkages'],
    beneficiaries: '30,000+',
    projects: 9,
    beneficiariesCount: 30000,
    contactPerson: 'Amit Kumar',
    email: 'team@rurallivelihoods.org',
  },
  {
    slug: 'women-rise-collective',
    name: 'Women Rise Collective',
    sector: 'Women Empowerment',
    region: 'Gujarat',
    verified: true,
    description: 'Self-help groups, financial literacy, and leadership development for rural women.',
    focusAreas: ['SHG Formation', 'Financial Literacy', 'Leadership'],
    beneficiaries: '20,000+',
    projects: 7,
    beneficiariesCount: 20000,
    contactPerson: 'Kavita Patel',
    email: 'connect@womenrise.org',
  },
  {
    slug: 'disaster-relief-alliance',
    name: 'Disaster Relief Alliance',
    sector: 'Disaster Relief',
    region: 'Pan-India',
    verified: true,
    description: 'Rapid response and rehabilitation support during natural disasters across India.',
    focusAreas: ['Emergency Response', 'Rehabilitation', 'Preparedness Training'],
    beneficiaries: '200,000+',
    projects: 20,
    beneficiariesCount: 200000,
    contactPerson: 'Arjun Mehta',
    email: 'ops@disasterrelief.org',
  },
  {
    slug: 'ability-first-trust',
    name: 'Ability First Trust',
    sector: 'Disability',
    region: 'Kerala',
    verified: false,
    description: 'Inclusive education, assistive technology, and employment support for persons with disabilities.',
    focusAreas: ['Inclusive Education', 'Assistive Tech', 'Employment'],
    beneficiaries: '5,000+',
    projects: 4,
    beneficiariesCount: 5000,
    contactPerson: 'Thomas George',
    email: 'info@abilityfirst.org',
  },
  {
    slug: 'clean-water-mission',
    name: 'Clean Water Mission',
    sector: 'Environment',
    region: 'Odisha',
    verified: true,
    description: 'Community-led water purification and sanitation projects in tribal districts of Odisha.',
    focusAreas: ['Water Purification', 'Sanitation', 'Community Training'],
    beneficiaries: '40,000+',
    projects: 11,
    beneficiariesCount: 40000,
    contactPerson: 'Sunita Mohanty',
    email: 'water@cleanwatermission.org',
  },
]

const ENRICHMENTS = {
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
    pastProjects: [
      { name: 'Green Maharashtra 2024', budget: '₹45L', outcome: '2M trees planted' },
      { name: 'Water for Villages', budget: '₹32L', outcome: '120 check dams' },
    ],
    impactMetrics: { treesPlanted: 2000000, waterBodiesRestored: 120, villagesReached: 85 },
    aiRecommended: true,
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
    pastProjects: [{ name: 'Digital Classrooms', budget: '₹28L', outcome: '150 centers' }],
    impactMetrics: { studentsReached: 25000, teachersTrained: 450, digitalCenters: 150 },
    aiRecommended: true,
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
    pastProjects: [{ name: 'Mobile Health Units', budget: '₹85L', outcome: '500 camps' }],
    impactMetrics: { patientsServed: 100000, mobileClinics: 12, healthCamps: 500 },
    aiRecommended: true,
  },
  'skill-build-foundation': {
    sdgs: [8, 5],
    csrThemes: ['Livelihood', 'Women Empowerment'],
    budgetRange: '25L-50L',
    orgSize: 'medium',
    riskScore: 14,
    rating: 4.3,
    reviewCount: 19,
    financialTransparency: 80,
    districts: ['Jaipur', 'Udaipur'],
    team: [{ name: 'Vikram Singh', role: 'Director' }],
    pastProjects: [{ name: 'Youth Skilling Program', budget: '₹22L', outcome: '1,200 placed' }],
    impactMetrics: { youthTrained: 15000, enterprisesSupported: 240 },
  },
  'child-hope-initiative': {
    sdgs: [4, 2],
    csrThemes: ['Education', 'Child Welfare'],
    budgetRange: '10L-25L',
    orgSize: 'small',
    riskScore: 10,
    rating: 4.5,
    reviewCount: 15,
    financialTransparency: 85,
    districts: ['East Delhi', 'Ghaziabad'],
    team: [{ name: 'Meera Kapoor', role: 'Executive Director' }],
    pastProjects: [{ name: 'Midday Nutrition Drive', budget: '₹12L', outcome: '3,000 children fed daily' }],
    impactMetrics: { childrenSupported: 8000, nutritionCenters: 18 },
  },
  'women-rise-collective': {
    sdgs: [5, 8],
    csrThemes: ['Women Empowerment', 'Livelihood'],
    budgetRange: '25L-50L',
    orgSize: 'medium',
    riskScore: 11,
    rating: 4.7,
    reviewCount: 22,
    financialTransparency: 90,
    districts: ['Ahmedabad', 'Surat'],
    team: [{ name: 'Kavita Patel', role: 'Founder' }],
    pastProjects: [{ name: 'SHG Scale-up', budget: '₹30L', outcome: '400 SHGs formed' }],
    impactMetrics: { womenEmpowered: 20000, shgsFormed: 400 },
  },
  'disaster-relief-alliance': {
    sdgs: [11, 13],
    csrThemes: ['Disaster Relief', 'Environment'],
    budgetRange: '1Cr+',
    orgSize: 'large',
    riskScore: 20,
    rating: 4.4,
    reviewCount: 41,
    financialTransparency: 87,
    districts: ['Pan-India'],
    team: [{ name: 'Arjun Mehta', role: 'Response Coordinator' }],
    pastProjects: [{ name: 'Flood Response 2024', budget: '₹1.2Cr', outcome: '12,000 families assisted' }],
    impactMetrics: { familiesAssisted: 200000, responseMissions: 20 },
  },
  'clean-water-mission': {
    sdgs: [6, 3],
    csrThemes: ['Environment', 'Healthcare'],
    budgetRange: '50L-1Cr',
    orgSize: 'medium',
    riskScore: 9,
    rating: 4.6,
    reviewCount: 26,
    financialTransparency: 91,
    districts: ['Koraput', 'Rayagada', 'Malkangiri'],
    team: [{ name: 'Sunita Mohanty', role: 'Program Director' }],
    pastProjects: [{ name: 'Tribal Water Access', budget: '₹40L', outcome: '200 purification units' }],
    impactMetrics: { peopleServed: 40000, purificationUnits: 200 },
  },
}

export const NGO_SEED_RECORDS = BASE.map((ngo) => {
  const extra = ENRICHMENTS[ngo.slug] || defaultEnrichment(ngo)
  const merged = {
    ...ngo,
    ...extra,
    primarySector: ngo.sector,
    sectors: [ngo.sector],
    statesServed: [ngo.region],
    districtsServed: extra.districts || [ngo.region],
    projectsCount: ngo.projects,
    verificationStatus: ngo.verified ? 'verified' : 'pending',
  }
  merged.tagSlugs = buildTagSlugs(merged)
  return merged
})

export const NGO_SEED_SLUGS = NGO_SEED_RECORDS.map((n) => n.slug)
