import { useState, useEffect } from 'react'
import { Download, FileText } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { DataTable } from '../../components/corporate/DataTable'
import { TabbedSections } from '../../components/corporate/TabbedSections'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { FileUploadZone } from '../../components/uploads/FileUploadZone'
import { documentsData } from '../../data/corporate/documents'
import { apiFetch } from '../../lib/api'

export default function DocumentVault() {
  const [activeTab, setActiveTab] = useState('Evidence')
  const [auditLog, setAuditLog] = useState([])
  const filtered = documentsData.documents.filter((d) => d.category === activeTab)

  useEffect(() => {
    apiFetch('/api/activity?entityType=file&limit=20')
      .then((res) => {
        const rows = (res.data?.activity || []).map((a) => ({
          timestamp: new Date(a.createdAt).toLocaleString(),
          action: a.action,
          document: a.metadata?.originalName || a.entityId || '—',
          user: a.userId?.slice(0, 8) || 'system',
        }))
        setAuditLog(rows.length ? rows : documentsData.auditLog)
      })
      .catch(() => setAuditLog(documentsData.auditLog))
  }, [])

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
          onUploaded={() => {
            apiFetch('/api/activity?entityType=file&limit=20').then((res) => {
              const rows = (res.data?.activity || []).map((a) => ({
                timestamp: new Date(a.createdAt).toLocaleString(),
                action: a.action,
                document: a.metadata?.originalName || a.entityId || '—',
                user: a.userId?.slice(0, 8) || 'system',
              }))
              if (rows.length) setAuditLog(rows)
            }).catch(() => {})
          }}
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
        <h3 className="font-semibold text-slate-900 mb-4">Audit Log</h3>
        <DataTable columns={auditColumns} data={auditLog} keyField="timestamp" />
      </Card>
    </>
  )
}
