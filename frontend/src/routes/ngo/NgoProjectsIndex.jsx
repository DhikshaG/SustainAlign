import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/corporate/PageHeader'
import { DataTable } from '../../components/corporate/DataTable'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { Badge } from '../../components/ui/Badge'
import { ngoProjects } from '../../data/ngo/projects'
import { NGO_ROUTES } from '../../lib/routes'
import { formatINR } from '../../data/ngo/dashboard'

export default function NgoProjectsIndex() {
  const navigate = useNavigate()
  const columns = [
    { key: 'name', label: 'Project', sortable: true, render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
    { key: 'partner', label: 'Corporate Partner', sortable: true },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'active' ? 'verified' : 'default'}>{r.status}</Badge> },
    { key: 'budget', label: 'Budget', render: (r) => formatINR(r.budget) },
    { key: 'progress', label: 'Progress', render: (r) => <ProgressBar value={r.progress} showValue={false} className="w-20" /> },
    { key: 'lastUpdate', label: 'Last Update', sortable: true },
  ]
  return (
    <>
      <PageHeader title="Project Management" description="Track milestones, upload evidence, and report progress to corporate partners." />
      <DataTable columns={columns} data={ngoProjects} keyField="id" onRowClick={(r) => navigate(NGO_ROUTES.projectDetail(r.id))} />
    </>
  )
}
