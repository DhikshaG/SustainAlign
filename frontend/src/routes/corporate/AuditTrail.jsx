import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { AuditLogTable } from '../../components/audit/AuditLogTable'
import { AuditFolderTree } from '../../components/audit/AuditFolderTree'
import { fetchAuditTrail, fetchAuditFolders, exportAuditPackage } from '../../lib/audit'
import { fetchProjects } from '../../lib/projects'
import { CORPORATE_ROUTES } from '../../lib/routes'

export default function AuditTrail() {
  const [trail, setTrail] = useState([])
  const [folders, setFolders] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [foldersLoading, setFoldersLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters] = useState({
    actionType: 'all',
    projectId: '',
    dateFrom: '',
    dateTo: '',
  })

  useEffect(() => {
    let active = true
    fetchProjects()
      .then((rows) => { if (active) setProjects(rows) })
      .catch(() => { if (active) setProjects([]) })
    return () => { active = false }
  }, [])

  function updateFilters(patch) {
    setFilters((f) => ({ ...f, ...patch }))
    setLoading(true)
    if ('projectId' in patch) setFoldersLoading(true)
  }

  useEffect(() => {
    let active = true
    const params = {
      actionType: filters.actionType === 'all' ? undefined : filters.actionType,
      projectId: filters.projectId || undefined,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom).toISOString() : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo).toISOString() : undefined,
      limit: 100,
    }
    fetchAuditTrail(params)
      .then((rows) => { if (active) setTrail(rows) })
      .catch(() => { if (active) setTrail([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [filters])

  useEffect(() => {
    let active = true
    fetchAuditFolders({ projectId: filters.projectId || undefined })
      .then((rows) => { if (active) setFolders(rows) })
      .catch(() => { if (active) setFolders([]) })
      .finally(() => { if (active) setFoldersLoading(false) })
    return () => { active = false }
  }, [filters.projectId])

  async function handleExport() {
    setExporting(true)
    try {
      const blob = await exportAuditPackage({
        projectId: filters.projectId || undefined,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom).toISOString() : undefined,
        dateTo: filters.dateTo ? new Date(filters.dateTo).toISOString() : undefined,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-trail-${Date.now()}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Audit Trail"
        description="Immutable log of uploads, approvals, disbursements, and compliance edits."
        actions={
          <Button variant="secondary" disabled={exporting} onClick={handleExport}>
            <Download className="h-4 w-4" /> {exporting ? 'Exporting…' : 'Export audit package'}
          </Button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h3 className="font-semibold text-slate-900 mb-3">Audit folders</h3>
          <AuditFolderTree folders={folders} loading={foldersLoading} />
          <p className="text-xs text-slate-500 mt-4">
            Documents are auto-organized by fiscal year, project, and category.
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex flex-wrap gap-3 mb-4">
            <Select
              value={filters.actionType}
              onChange={(e) => updateFilters({ actionType: e.target.value })}
              className="w-40"
            >
              <option value="all">All types</option>
              <option value="upload">Uploads</option>
              <option value="approval">Approvals</option>
              <option value="payment">Payments</option>
              <option value="edit">Edits</option>
            </Select>
            <Select
              value={filters.projectId}
              onChange={(e) => updateFilters({ projectId: e.target.value })}
              className="w-48"
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilters({ dateFrom: e.target.value })}
              className="w-36"
            />
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilters({ dateTo: e.target.value })}
              className="w-36"
            />
          </div>
          <AuditLogTable rows={trail} loading={loading} />
          <p className="text-xs text-slate-500 mt-4">
            Pending approvals are also in the{' '}
            <Link to={CORPORATE_ROUTES.approvals} className="text-primary-600 hover:underline">Approvals inbox</Link>.
          </p>
        </Card>
      </div>
    </>
  )
}
