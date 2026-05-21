import { PageHeader } from '../../components/corporate/PageHeader'
import { DataTable } from '../../components/corporate/DataTable'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { BarChartCard } from '../../components/corporate/Charts'
import { fraudAlerts, fraudTrend } from '../../data/admin/fraud'
import { useActivityLog } from '../../hooks/useActivityLog'

export default function FraudMonitoring() {
  const { activity } = useActivityLog({ admin: true, limit: 15 })

  const columns = [
    { key: 'level', label: 'Level', render: (r) => <Badge variant={r.level === 'high' ? 'warning' : 'default'}>{r.level}</Badge> },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'entity', label: 'Entity', sortable: true },
    { key: 'score', label: 'Risk Score', sortable: true },
    { key: 'date', label: 'Date', sortable: true },
  ]

  const activityColumns = [
    { key: 'at', label: 'Time', render: (r) => new Date(r.at).toLocaleString() },
    { key: 'action', label: 'Action' },
    { key: 'user', label: 'User', render: (r) => r.user?.email || '—' },
    { key: 'entity', label: 'Entity', render: (r) => `${r.entity?.type || ''} ${r.entity?.id || ''}`.trim() || '—' },
  ]

  return (
    <>
      <PageHeader title="Fraud Monitoring" description="Risk flags, suspicious activity, and anomaly detection." />
      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Active Alerts</h3>
        <div className="space-y-3">
          {fraudAlerts.map((a) => (
            <div key={a.id} className="flex items-start gap-3 text-sm border-l-2 border-red-400 pl-3">
              <Badge variant="warning">{a.level}</Badge>
              <div><p className="font-medium">{a.type} — {a.entity}</p><p className="text-slate-600">{a.description}</p></div>
              <span className="ml-auto text-slate-400 shrink-0">{a.date}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Recent Platform Activity</h3>
        <DataTable columns={activityColumns} data={activity} keyField="id" />
      </Card>

      <BarChartCard title="Alert Trend" data={fraudTrend} xKey="month" bars={[{ key: 'alerts', color: '#dc2626', name: 'Alerts' }]} />
      <div className="mt-6">
        <h3 className="font-semibold text-slate-900 mb-4">Risk Score Table</h3>
        <DataTable columns={columns} data={fraudAlerts} keyField="id" />
      </div>
    </>
  )
}
