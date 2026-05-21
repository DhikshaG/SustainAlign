import { useState } from 'react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { DataTable } from '../../components/corporate/DataTable'
import { TabbedSections } from '../../components/corporate/TabbedSections'
import { Badge } from '../../components/ui/Badge'
import { AuditLogTable } from '../../components/audit/AuditLogTable'
import { complianceMonitoring } from '../../data/admin/compliance'
import { fetchAdminAuditTrail } from '../../lib/audit'

function formatCr(n) {
  return `₹${(n / 10000000).toFixed(2)} Cr`
}

export default function ComplianceMonitoring() {
  const [activeTab, setActiveTab] = useState('obligations')
  const [auditRows, setAuditRows] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditLoaded, setAuditLoaded] = useState(false)

  function loadAudit() {
    if (auditLoaded) return
    setAuditLoading(true)
    fetchAdminAuditTrail({ limit: 50 })
      .then((rows) => { setAuditRows(rows); setAuditLoaded(true) })
      .catch(() => setAuditRows([]))
      .finally(() => setAuditLoading(false))
  }

  function handleTabChange(tab) {
    setActiveTab(tab)
    if (tab === 'audit') loadAudit()
  }

  const columns = [
    { key: 'company', label: 'Company', sortable: true, render: (r) => <span className="font-medium">{r.company}</span> },
    { key: 'obligation', label: 'Obligation', render: (r) => formatCr(r.obligation) },
    { key: 'spent', label: 'Spent', render: (r) => formatCr(r.spent) },
    { key: 'unspent', label: 'Unspent', render: (r) => formatCr(r.unspent) },
    { key: 'alerts', label: 'Alerts', sortable: true, render: (r) => r.alerts > 0 ? <Badge variant="warning">{r.alerts}</Badge> : '0' },
    { key: 'score', label: 'Score', sortable: true, render: (r) => <Badge variant={r.score >= 80 ? 'verified' : 'warning'}>{r.score}</Badge> },
  ]

  return (
    <>
      <PageHeader title="Compliance Monitoring" description="Cross-tenant Section 135 compliance status and platform audit activity." />

      <TabbedSections
        tabs={[
          { id: 'obligations', label: 'Obligations' },
          { id: 'audit', label: 'Audit Activity' },
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {activeTab === 'obligations' && (
        <DataTable columns={columns} data={complianceMonitoring} keyField="id" />
      )}

      {activeTab === 'audit' && (
        <AuditLogTable rows={auditRows} loading={auditLoading} />
      )}
    </>
  )
}
