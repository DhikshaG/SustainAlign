export const documentsData = {
  categories: ['Evidence', 'Invoices', 'Utilization Certificates'],
  documents: [
    { id: 'doc-1', name: 'Afforestation Progress Photos Q3', category: 'Evidence', project: 'Green Maharashtra', date: '2025-10-15', size: '12.4 MB' },
    { id: 'doc-2', name: 'Invoice #INV-2025-0842', category: 'Invoices', project: 'Digital Classrooms', date: '2025-11-02', size: '245 KB' },
    { id: 'doc-3', name: 'UC - Mobile Health Q2 FY25', category: 'Utilization Certificates', project: 'Mobile Health TN', date: '2025-09-30', size: '1.2 MB' },
    { id: 'doc-4', name: 'Milestone Completion Report', category: 'Evidence', project: 'Green Maharashtra', date: '2025-12-20', size: '3.8 MB' },
    { id: 'doc-5', name: 'Invoice #INV-2025-0911', category: 'Invoices', project: 'Skill Development', date: '2025-12-05', size: '198 KB' },
    { id: 'doc-6', name: 'UC - SkillBuild Q1 FY25', category: 'Utilization Certificates', project: 'Skill Development', date: '2025-06-30', size: '890 KB' },
  ],
  auditLog: [
    { action: 'Download', document: 'UC - Mobile Health Q2 FY25', user: 'admin@acme.com', timestamp: '2026-01-12 14:32' },
    { action: 'Upload', document: 'Afforestation Progress Photos Q3', user: 'csr_head@acme.com', timestamp: '2026-01-10 09:15' },
    { action: 'View', document: 'Invoice #INV-2025-0842', user: 'finance@acme.com', timestamp: '2026-01-08 16:45' },
    { action: 'Download', document: 'Milestone Completion Report', user: 'admin@acme.com', timestamp: '2026-01-05 11:20' },
  ],
}
