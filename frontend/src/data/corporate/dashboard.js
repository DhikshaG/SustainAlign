export const dashboardSummary = {
  budget: {
    total: 25000000,
    allocated: 18750000,
    spent: 14200000,
    currency: 'INR',
  },
  spendProgress: [
    { month: 'Apr', spent: 800000, obligation: 2083333 },
    { month: 'May', spent: 1650000, obligation: 4166666 },
    { month: 'Jun', spent: 2800000, obligation: 6250000 },
    { month: 'Jul', spent: 4200000, obligation: 8333333 },
    { month: 'Aug', spent: 5800000, obligation: 10416666 },
    { month: 'Sep', spent: 7500000, obligation: 12500000 },
    { month: 'Oct', spent: 9200000, obligation: 14583333 },
    { month: 'Nov', spent: 11000000, obligation: 16666666 },
    { month: 'Dec', spent: 12800000, obligation: 18750000 },
    { month: 'Jan', spent: 14200000, obligation: 20833333 },
  ],
  activeProjects: {
    count: 14,
    list: [
      { id: 'proj-001', name: 'Green Maharashtra Afforestation', ngo: 'Green Earth Foundation', progress: 72 },
      { id: 'proj-002', name: 'Digital Classrooms Karnataka', ngo: 'EduRise India', progress: 45 },
      { id: 'proj-003', name: 'Mobile Health Tamil Nadu', ngo: 'Health For All Trust', progress: 88 },
    ],
  },
  complianceScore: 87,
  deadlines: [
    { id: 1, title: 'MCA CSR-2 Annual Filing', date: '2026-03-31', type: 'regulatory', urgent: true },
    { id: 2, title: 'Q4 Utilization Certificate', date: '2026-01-15', type: 'document', urgent: true },
    { id: 3, title: 'Board CSR Committee Review', date: '2026-02-28', type: 'internal', urgent: false },
    { id: 4, title: 'Unspent CSR Transfer (if any)', date: '2026-04-30', type: 'regulatory', urgent: false },
  ],
  ngoPerformance: [
    { name: 'Health For All Trust', score: 94, spend: 3200000 },
    { name: 'Green Earth Foundation', score: 91, spend: 2800000 },
    { name: 'EduRise India', score: 88, spend: 2100000 },
    { name: 'Clean Water Mission', score: 85, spend: 1800000 },
    { name: 'Women Rise Collective', score: 82, spend: 1500000 },
  ],
  impactMetrics: [
    { sdg: 3, label: 'Lives Impacted (Health)', value: '125K' },
    { sdg: 4, label: 'Students Reached', value: '45K' },
    { sdg: 13, label: 'CO₂ Offset (tons)', value: '12.4K' },
    { sdg: 6, label: 'Water Access (households)', value: '8.2K' },
  ],
  aiRecommendations: [
    {
      id: 1,
      title: 'Increase Environment allocation',
      body: 'Your Schedule VII spend on Environment is 18% vs 22% industry benchmark. Consider Green Earth Foundation.',
      cta: { label: 'Explore NGOs', href: '/dashboard/discovery' },
    },
    {
      id: 2,
      title: 'Compliance gap: Unspent CSR',
      body: '₹1.08 Cr unspent from FY24 may need transfer to PM CARES or eligible fund by Mar 31.',
      cta: { label: 'View Compliance', href: '/dashboard/compliance' },
    },
    {
      id: 3,
      title: 'Project at risk',
      body: 'SkillBuild Foundation project is 30% behind milestone schedule. Review updates.',
      cta: { label: 'Open Project', href: '/dashboard/projects/proj-004' },
    },
  ],
  notificationCount: 5,
}

export function formatINR(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}
