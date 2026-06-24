export const ngoProjects = [
  {
    id: 'proj-001',
    name: 'Green Maharashtra Afforestation',
    partner: 'Acme Industries Ltd',
    status: 'active',
    budget: 4500000,
    spent: 3240000,
    progress: 72,
    lastUpdate: '2026-01-10',
    milestones: [
      { id: 'm1', title: 'Site identification & sapling procurement', due: '2025-05-15', status: 'completed', progress: 100 },
      { id: 'm2', title: 'Plant 500K saplings', due: '2025-09-30', status: 'completed', progress: 100 },
      { id: 'm3', title: 'Plant 1M saplings', due: '2025-12-31', status: 'in_progress', progress: 72 },
      { id: 'm4', title: 'Survival audit & reporting', due: '2026-02-28', status: 'pending', progress: 0 },
    ],
    evidence: [
      { id: 'e-1', name: 'Planting photos Q3', date: '2025-10-15', type: 'photo' },
      { id: 'e-2', name: 'Sapling receipt invoice', date: '2025-08-20', type: 'invoice' },
    ],
    expenses: [
      { id: 'ex-1', description: 'Sapling procurement batch 2', amount: 850000, date: '2025-09-01', status: 'approved' },
      { id: 'ex-2', description: 'Field staff salaries Q3', amount: 420000, date: '2025-10-01', status: 'pending' },
    ],
    beneficiaries: { direct: 50000, added: 1200 },
  },
  {
    id: 'proj-005',
    name: 'Urban Tree Cover Pune',
    partner: 'Acme Industries Ltd',
    status: 'active',
    budget: 1800000,
    spent: 810000,
    progress: 45,
    lastUpdate: '2026-01-05',
    milestones: [
      { id: 'm1', title: 'Urban site survey', due: '2025-07-31', status: 'completed', progress: 100 },
      { id: 'm2', title: 'Plant 50K urban trees', due: '2025-12-31', status: 'in_progress', progress: 45 },
    ],
    evidence: [],
    expenses: [
      { id: 'ex-3', description: 'Urban saplings', amount: 320000, date: '2025-11-15', status: 'approved' },
    ],
    beneficiaries: { direct: 8000, added: 450 },
  },
  {
    id: 'proj-008',
    name: 'Watershed Restoration Nashik',
    partner: 'Beta Corp',
    status: 'planning',
    budget: 2200000,
    spent: 0,
    progress: 10,
    lastUpdate: '2025-12-20',
    milestones: [
      { id: 'm1', title: 'Needs assessment', due: '2026-02-28', status: 'in_progress', progress: 60 },
    ],
    evidence: [],
    expenses: [],
    beneficiaries: { direct: 0, added: 0 },
  },
]

export function getNgoProject(id) {
  return ngoProjects.find((p) => p.id === id)
}
