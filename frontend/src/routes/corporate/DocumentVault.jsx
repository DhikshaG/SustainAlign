import { useEffect, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { TabbedSections } from '../../components/corporate/TabbedSections'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { FileUploadZone } from '../../components/uploads/FileUploadZone'
import { AuditLogTable } from '../../components/audit/AuditLogTable'
import { FileVersionHistory } from '../../components/audit/FileVersionHistory'
import { useActivityLog } from '../../hooks/useActivityLog'
import { fetchDocuments, exportAuditPackage, TAB_CATEGORIES, CATEGORY_TABS } from '../../lib/audit'
import { fetchProjects } from '../../lib/projects'
import { api } from '../../lib/api'

const UPLOAD_CATEGORY_BY_TAB = {
  Evidence: 'project_evidence',
  Invoices: 'invoice',
  'Utilization Certificates': 'compliance',
}

export default function DocumentVault() {
  const [activeTab, setActiveTab] = useState('Evidence')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [documents, setDocuments] = useState([])
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [versionFileId, setVersionFileId] = useState(null)
  const [exporting, setExporting] = useState(false)
  const { activity, setFilters, reload } = useActivityLog({
    entityType: 'file',
    limit: 50,
  })

  useEffect(() => {
    let active = true
    fetchDocuments()
      .then((data) => { if (active) setDocuments(data.files ?? []) })
      .catch(() => { if (active) setDocuments([]) })
    fetchProjects()
      .then((rows) => { if (active) setProjects(rows) })
      .catch(() => { if (active) setProjects([]) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    setFilters((f) => ({
      ...f,
      entityType: 'file',
      action: actionFilter || undefined,
      dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    }))
  }, [actionFilter, dateFrom, setFilters])

  const categoryKey = TAB_CATEGORIES[activeTab]
  const filtered = documents.filter((d) => d.category === categoryKey)

  async function refreshDocs() {
    const data = await fetchDocuments()
    setDocuments(data.files ?? [])
    reload()
  }

  async function handleDownload(file) {
    if (!file.downloadUrl) return
    try {
      const blob = await api.download(file.downloadUrl)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.originalName || 'download'
      a.click()
      URL.revokeObjectURL(url)
      reload()
    } catch {
      /* ignore */
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const blob = await exportAuditPackage(projectId ? { projectId } : {})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-package-${Date.now()}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Document Vault"
        description="Evidence, invoices, utilization certificates, and audit logs."
        actions={
          <Button variant="secondary" disabled={exporting} onClick={handleExport}>
            <Download className="h-4 w-4" /> {exporting ? 'Exporting…' : 'Download Center'}
          </Button>
        }
      />

      <Card className="mb-6 space-y-3">
        <FormFieldRow label="Link to project (optional)">
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="max-w-md">
            <option value="">General / no project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </FormFieldRow>
        <FileUploadZone
          category={UPLOAD_CATEGORY_BY_TAB[activeTab] || 'project_evidence'}
          entityType={projectId ? 'project' : undefined}
          entityId={projectId || undefined}
          label="Upload evidence, invoices, or utilization certificates"
          hint="PDF, JPG, PNG up to 10 MB"
          onUploaded={() => refreshDocs()}
        />
      </Card>

      <TabbedSections
        tabs={CATEGORY_TABS.map((c) => ({ id: c, label: c }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="space-y-2 mb-8">
        {filtered.length === 0 ? (
          <Card><p className="text-sm text-slate-500">No documents in this category yet.</p></Card>
        ) : (
          filtered.map((doc) => (
            <Card key={doc.id} padding className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm text-slate-900 truncate">{doc.originalName}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {doc.auditPath || doc.category}
                    {doc.createdAt && ` · ${new Date(doc.createdAt).toLocaleDateString()}`}
                  </p>
                </div>
                {doc.version > 1 && <Badge variant="default">v{doc.version}</Badge>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => setVersionFileId(doc.id)}>History</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="w-48">
            <option value="">All actions</option>
            <option value="file.upload">Upload</option>
            <option value="file.download">Download</option>
            <option value="file.version.create">New version</option>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <h3 className="font-semibold text-slate-900 mb-4">Audit Log</h3>
        <AuditLogTable rows={activity} loading={false} />
      </Card>

      {versionFileId && (
        <FileVersionHistory fileId={versionFileId} onClose={() => setVersionFileId(null)} />
      )}
    </>
  )
}

function FormFieldRow({ label, children }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-1">{label}</p>
      {children}
    </div>
  )
}
