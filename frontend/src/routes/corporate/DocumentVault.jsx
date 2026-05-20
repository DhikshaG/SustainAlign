import { useState } from 'react'
import { Upload, Download, FileText } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { DataTable } from '../../components/corporate/DataTable'
import { TabbedSections } from '../../components/corporate/TabbedSections'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { documentsData } from '../../data/corporate/documents'

export default function DocumentVault() {
  const [activeTab, setActiveTab] = useState('Evidence')
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
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
          <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600 mb-1">Upload evidence, invoices, or utilization certificates</p>
          <p className="text-xs text-slate-400 mb-4">PDF, JPG, PNG up to 10MB</p>
          <Button variant="secondary" size="sm">Choose Files</Button>
        </div>
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
        <DataTable columns={auditColumns} data={documentsData.auditLog} keyField="timestamp" />
      </Card>
    </>
  )
}
