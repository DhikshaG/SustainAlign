export const ngoFinance = {
  utilization: {
    total: 8500000,
    spent: 6120000,
    byProject: [
      { name: 'Green Maharashtra', allocated: 4500000, spent: 3240000 },
      { name: 'Urban Tree Cover', allocated: 1800000, spent: 810000 },
      { name: 'Watershed Restoration', allocated: 2200000, spent: 0 },
    ],
    monthly: [
      { month: 'Apr', spent: 400000 },
      { month: 'May', spent: 850000 },
      { month: 'Jun', spent: 1200000 },
      { month: 'Jul', spent: 1800000 },
      { month: 'Aug', spent: 2400000 },
      { month: 'Sep', spent: 3100000 },
      { month: 'Oct', spent: 4200000 },
      { month: 'Nov', spent: 5200000 },
      { month: 'Dec', spent: 6120000 },
    ],
  },
  invoices: [
    { id: 'inv-1', number: 'INV-2025-0842', project: 'Green Maharashtra', amount: 850000, date: '2025-09-01', status: 'paid' },
    { id: 'inv-2', number: 'INV-2025-0911', project: 'Urban Tree Cover', amount: 320000, date: '2025-11-15', status: 'paid' },
    { id: 'inv-3', number: 'INV-2026-0012', project: 'Green Maharashtra', amount: 420000, date: '2026-01-05', status: 'pending' },
  ],
  expenseReports: [
    { id: 'er-1', period: 'Q3 FY25', project: 'Green Maharashtra', total: 1270000, status: 'approved', date: '2025-10-15' },
    { id: 'er-2', period: 'Q4 FY25', project: 'Green Maharashtra', total: 980000, status: 'submitted', date: '2026-01-08' },
  ],
  auditDocs: [
    { id: 'ad-1', name: 'Q3 Utilization Certificate', date: '2025-10-01', status: 'verified' },
    { id: 'ad-2', name: 'Annual Audit Report FY24', date: '2025-04-15', status: 'verified' },
    { id: 'ad-3', name: 'Q4 Utilization Certificate', date: null, status: 'pending' },
  ],
}
