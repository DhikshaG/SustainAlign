import { PageHeader } from '../../components/corporate/PageHeader'
import { DataTable } from '../../components/corporate/DataTable'
import { Badge } from '../../components/ui/Badge'
import { complianceMonitoring } from '../../data/admin/compliance'

function formatCr(n) {
  return `₹${(n / 10000000).toFixed(2)} Cr`
}

export default function ComplianceMonitoring() {
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
      <PageHeader title="Compliance Monitoring" description="Cross-tenant Section 135 compliance status and alerts." />
      <DataTable columns={columns} data={complianceMonitoring} keyField="id" />
    </>
  )
}
