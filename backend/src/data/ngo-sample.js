// Mirror of frontend NGO sample data for API stubs
export const dashboardSummary = {
  activeProjects: { count: 3 },
  pendingApprovals: 2,
  fundUtilization: { allocated: 8500000, spent: 6120000, percent: 72 },
  notificationCount: 4,
}

export const profile = {
  name: 'Green Earth Foundation',
  registrationNumber: 'NGO-12345',
  verificationStatus: 'verified',
}

export const projects = [
  {
    id: 'proj-001',
    name: 'Green Maharashtra Afforestation',
    partner: 'Acme Industries Ltd',
    status: 'active',
    progress: 72,
  },
  { id: 'proj-005', name: 'Urban Tree Cover Pune', partner: 'Acme Industries Ltd', status: 'active', progress: 45 },
]

export const financeSummary = {
  total: 8500000,
  spent: 6120000,
  percent: 72,
}

export const beneficiaries = {
  total: 58450,
  households: 8500,
}

export function getProject(id) {
  return projects.find((p) => p.id === id) || null
}
