export const settingsData = {
  team: [
    { email: 'admin@acme.com', name: 'Admin User', role: 'super_admin', status: 'active' },
    { email: 'csr@acme.com', name: 'CSR Head', role: 'csr_head', status: 'active' },
    { email: 'finance@acme.com', name: 'Finance Lead', role: 'finance', status: 'active' },
    { email: 'compliance@acme.com', name: 'Compliance Officer', role: 'compliance', status: 'active' },
  ],
  permissions: [
    { module: 'Dashboard', super_admin: true, csr_head: true, esg_head: true, finance: true, compliance: true, volunteer: true, board: true },
    { module: 'ESG Dashboard', super_admin: true, csr_head: true, esg_head: true, finance: false, compliance: false, volunteer: false, board: true },
    { module: 'NGO Discovery', super_admin: true, csr_head: true, esg_head: true, finance: false, compliance: false, volunteer: false, board: false },
    { module: 'Projects', super_admin: true, csr_head: true, esg_head: true, finance: true, compliance: false, volunteer: false, board: false },
    { module: 'Compliance', super_admin: true, csr_head: true, esg_head: false, finance: true, compliance: true, volunteer: false, board: false },
    { module: 'Reporting', super_admin: true, csr_head: true, esg_head: true, finance: true, compliance: true, volunteer: false, board: true },
    { module: 'Settings', super_admin: true, csr_head: true, esg_head: false, finance: false, compliance: false, volunteer: false, board: false },
  ],
  integrations: [
    { name: 'Email (SMTP)', status: 'connected', description: 'Transactional emails and notifications' },
    { name: 'MCA Portal', status: 'available', description: 'CSR-2 filing integration (coming soon)' },
    { name: 'Slack', status: 'available', description: 'Team notifications' },
    { name: 'Google Workspace', status: 'connected', description: 'SSO and calendar sync' },
  ],
  notifications: {
    emailDigest: true,
    complianceAlerts: true,
    projectUpdates: true,
    ngoMessages: true,
    approvalRequests: true,
  },
  branding: {
    companyName: 'Acme Industries Ltd',
    primaryColor: '#059669',
    logoUrl: null,
  },
}
