export const overview = {
  totalUsers: 1248,
  corporateTenants: 86,
  ngoTenants: 342,
  pendingVerifications: 12,
  openTickets: 8,
  fraudAlerts: 3,
}

export const users = [
  {
    id: 'u-1',
    email: 'admin@acme.com',
    tenant: 'Acme Industries Ltd',
    type: 'corporate',
    role: 'super_admin',
    status: 'active',
  },
  {
    id: 'u-2',
    email: 'admin@greenearth.org',
    tenant: 'Green Earth Foundation',
    type: 'ngo',
    role: 'ngo_admin',
    status: 'active',
  },
]

export const verificationQueue = [
  { id: 'v-1', ngoName: 'Ability First Trust', email: 'admin@abilityfirst.org', status: 'pending' },
  { id: 'v-2', ngoName: 'Rural Livelihoods Network', email: 'contact@ruralnet.org', status: 'pending' },
]

export const fraudAlerts = [{ id: 'f-1', level: 'high', type: 'Duplicate invoice', entity: 'SkillBuild Foundation' }]

export const analytics = {
  totalTenants: 431,
  activeProjects: 1240,
}

export const supportTickets = [{ id: 't-1001', subject: 'Cannot upload utilization certificate', status: 'open' }]

export const compliance = [{ id: 'c-1', company: 'Acme Industries Ltd', score: 78, alerts: 2 }]

export const aiMonitoring = {
  totalQueries: 8420,
  flaggedCount: 3,
}

export const contentModeration = [
  { id: 'cm-1', type: 'NGO Profile', title: 'Rural Livelihoods Network', status: 'pending' },
]
