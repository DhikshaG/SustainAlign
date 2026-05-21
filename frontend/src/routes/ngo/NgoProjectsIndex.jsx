import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/corporate/PageHeader'
import { DataTable } from '../../components/corporate/DataTable'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { projectStatuses } from '../../data/corporate/projects'
import { NGO_ROUTES } from '../../lib/routes'
import { formatINR } from '../../data/ngo/dashboard'
import { fetchNgoProjects } from '../../lib/projects'

export default function NgoProjectsIndex() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setProjects(await fetchNgoProjects())
    } catch (err) {
      setError(err.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const columns = [
    { key: 'name', label: 'Project', sortable: true, render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
    { key: 'partner', label: 'Corporate Partner', sortable: true, render: (r) => r.partner || r.corporateName },
    { key: 'status', label: 'Status', render: (r) => {
      const s = projectStatuses[r.status] || projectStatuses.active
      return <Badge variant={s.variant}>{s.label}</Badge>
    }},
    { key: 'budget', label: 'Budget', render: (r) => formatINR(r.budget ?? r.budgetInr) },
    { key: 'progress', label: 'Progress', render: (r) => <ProgressBar value={r.progress ?? 0} showValue={false} className="w-20" /> },
  ]

  return (
    <>
      <PageHeader title="Project Management" description="Track milestones, upload evidence, and report progress to corporate partners." />
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
          <Button variant="ghost" size="sm" className="ml-2" onClick={load}>Retry</Button>
        </Alert>
      )}
      {loading ? (
        <p className="text-sm text-slate-500">Loading projects…</p>
      ) : (
        <DataTable columns={columns} data={projects} keyField="id" onRowClick={(r) => navigate(NGO_ROUTES.projectDetail(r.id))} />
      )}
    </>
  )
}
