export const ngoDashboardSummary = {
  activeProjects: {
    count: 3,
    list: [
      { id: 'proj-001', name: 'Green Maharashtra Afforestation', partner: 'Acme Industries Ltd', progress: 72 },
      { id: 'proj-005', name: 'Urban Tree Cover Pune', partner: 'Acme Industries Ltd', progress: 45 },
      { id: 'proj-008', name: 'Watershed Restoration Nashik', partner: 'Beta Corp', progress: 30 },
    ],
  },
  pendingApprovals: [
    { id: 'a-1', title: 'Milestone 3 completion report', project: 'Green Maharashtra', date: '2026-01-10' },
    { id: 'a-2', title: 'Expense claim — sapling procurement', project: 'Urban Tree Cover', date: '2026-01-08' },
  ],
  fundUtilization: {
    allocated: 8500000,
    spent: 6120000,
    percent: 72,
  },
  upcomingReports: [
    { id: 'r-1', title: 'Q4 Utilization Certificate', due: '2026-01-20', type: 'UC' },
    { id: 'r-2', title: 'Milestone 3 Progress Report', due: '2026-01-31', type: 'Milestone' },
    { id: 'r-3', title: 'Annual Impact Assessment', due: '2026-03-15', type: 'Impact' },
  ],
  impactMetrics: [
    { label: 'Trees Planted', value: '1.44M', sdg: 15 },
    { label: 'Villages Reached', value: '62', sdg: 11 },
    { label: 'Beneficiaries', value: '50K+', sdg: 1 },
    { label: 'CO₂ Offset (tons)', value: '8.2K', sdg: 13 },
  ],
  notificationCount: 4,
}

export function formatINR(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}
