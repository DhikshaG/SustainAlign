import { useState, useEffect } from 'react'
import { Download, FileText } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { DataTable } from '../../components/corporate/DataTable'
import { TabbedSections } from '../../components/corporate/TabbedSections'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { FileUploadZone } from '../../components/uploads/FileUploadZone'
import { documentsData } from '../../data/corporate/documents'
import { useActivityLog } from '../../hooks/useActivityLog'

function mapRows(activity) {
  return activity.map((a) => ({
    timestamp: a.at ? new Date(a.at).toLocaleString() : '—',
    action: a.action,
    document: a.metadata?.originalName || a.entity?.id || '—',
    user: a.user?.email || a.user?.name || 'system',
  }))
}

export default function DocumentVault() {
  const [activeTab, setActiveTab] = useState('Evidence')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const { activity, setFilters, reload } = useActivityLog({
    entityType: 'file',
    limit: 50,
  })

  useEffect(() => {
    setFilters((f) => ({
      ...f,
      entityType: 'file',
      action: actionFilter || undefined,
      dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    }))
  }, [actionFilter, dateFrom, setFilters])

  const auditLog = activity.length ? mapRows(activity) : documentsData.auditLog
  const filtered = documentsData.documents.filter((d) => d.category === activeTab)

  const auditColumns = [
    { key: 'timestamp', label: 'Time', sortable: true },
    { key: 'action', label: 'Action', sortable: true },
    { key: 'document', label: 'Document', sortable: true },
    { key: 'user', label: 'User', sortable: true },
  ]

  return (
    <>
      <PageHeader
        title="Document Vault"
        description="Evidence, invoices, utilization certificates, and audit logs."
        actions={
          <Button variant="secondary">
            <Download className="h-4 w-4" /> Download Center
          </Button>
        }
      />

      <Card className="mb-6">
        <FileUploadZone
          category="project_evidence"
          label="Upload evidence, invoices, or utilization certificates"
          hint="PDF, JPG, PNG up to 10 MB"
          onUploaded={() => reload()}
        />
      </Card>

      <TabbedSections
        tabs={documentsData.categories.map((c) => ({ id: c, label: c }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="space-y-2 mb-8">
        {filtered.map((doc) => (
          <Card key={doc.id} padding className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-slate-400" />
              <div>
                <p className="font-medium text-sm text-slate-900">{doc.name}</p>
                <p className="text-xs text-slate-500">{doc.project} · {doc.date} · {doc.size}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="w-48">
            <option value="">All actions</option>
            <option value="file.upload">File upload</option>
            <option value="auth.login.success">Login</option>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <h3 className="font-semibold text-slate-900 mb-4">Audit Log</h3>
        <DataTable columns={auditColumns} data={auditLog} keyField="timestamp" />
      </Card>
    </>
  )
}
