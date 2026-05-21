import { DataTable } from '../corporate/DataTable'
import { Badge } from '../ui/Badge'

function formatValue(val) {
  if (val == null) return '—'
  if (typeof val === 'object') return JSON.stringify(val).slice(0, 80)
  return String(val)
}

export function AuditLogTable({ rows, loading }) {
  if (loading) return <p className="text-sm text-slate-500">Loading audit log…</p>
  if (!rows?.length) return <p className="text-sm text-slate-500">No audit entries match your filters.</p>

  const tableRows = rows.map((r) => ({
    id: r.id,
    timestamp: r.at ? new Date(r.at).toLocaleString() : '—',
    action: r.label || r.action,
    category: r.category || '—',
    entity: r.entity?.type ? `${r.entity.type}:${(r.entity.id || '').slice(0, 8)}` : '—',
    user: r.user?.email || r.user?.name || 'system',
    change: r.previousValue
      ? `${formatValue(r.previousValue)} → ${formatValue(r.metadata)}`
      : formatValue(r.metadata),
  }))

  const columns = [
    { key: 'timestamp', label: 'Time', sortable: true },
    {
      key: 'category',
      label: 'Type',
      render: (row) => <Badge variant="default">{row.category}</Badge>,
    },
    { key: 'action', label: 'Action', sortable: true },
    { key: 'entity', label: 'Entity' },
    { key: 'user', label: 'User' },
    { key: 'change', label: 'Details' },
  ]

  return <DataTable columns={columns} data={tableRows} keyField="id" />
}
