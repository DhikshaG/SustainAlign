import { useState } from 'react'
import { Download } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { TabbedSections } from '../../components/corporate/TabbedSections'
import { DataTable } from '../../components/corporate/DataTable'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { AreaChartCard } from '../../components/corporate/Charts'
import { ngoFinance } from '../../data/ngo/finance'
import { formatINR } from '../../data/ngo/dashboard'

import { submitNgoReport } from '../../lib/workflow'
import { WorkflowStatusBadge } from '../../components/workflow/WorkflowStatusBadge'

export default function FinancialReporting() {
  const [activeTab, setActiveTab] = useState('utilization')
  const [submitting, setSubmitting] = useState(false)
  const [lastWorkflow, setLastWorkflow] = useState(null)
  const tabs = [
    { id: 'utilization', label: 'Fund Utilization' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'expenses', label: 'Expense Reports' },
    { id: 'audit', label: 'Audit Docs' },
  ]

  const invoiceCols = [
    { key: 'number', label: 'Invoice #', sortable: true },
    { key: 'project', label: 'Project', sortable: true },
    { key: 'amount', label: 'Amount', render: (r) => formatINR(r.amount) },
    { key: 'date', label: 'Date', sortable: true },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'paid' ? 'verified' : 'warning'}>{r.status}</Badge> },
  ]

  return (
    <>
      <PageHeader title="Financial Reporting" description="Fund utilization, invoices, expense reports, and audit documents." />
      <TabbedSections tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'utilization' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card><p className="text-sm text-slate-500">Total Allocated</p><p className="text-2xl font-bold">{formatINR(ngoFinance.utilization.total)}</p></Card>
            <Card><p className="text-sm text-slate-500">Total Spent</p><p className="text-2xl font-bold">{formatINR(ngoFinance.utilization.spent)}</p></Card>
            <Card><p className="text-sm text-slate-500">Utilization Rate</p><p className="text-2xl font-bold">{Math.round((ngoFinance.utilization.spent / ngoFinance.utilization.total) * 100)}%</p></Card>
          </div>
          <AreaChartCard title="Monthly Spend" data={ngoFinance.utilization.monthly} lines={[{ key: 'spent', color: '#059669', name: 'Spent' }]} />
        </div>
      )}
      {activeTab === 'invoices' && (
        <>
          <DataTable columns={invoiceCols} data={ngoFinance.invoices} keyField="id" />
          <Button variant="secondary" size="sm" className="mt-4"><Download className="h-4 w-4" /> Download All</Button>
        </>
      )}
      {activeTab === 'expenses' && (
        <div className="space-y-3">
          {ngoFinance.expenseReports.map((er) => (
            <Card key={er.id} className="flex justify-between items-center">
              <div><p className="font-medium">{er.period} — {er.project}</p><p className="text-sm text-slate-500">{er.date}</p></div>
              <div className="text-right"><p className="font-semibold">{formatINR(er.total)}</p><Badge variant={er.status === 'approved' ? 'verified' : 'primary'}>{er.status}</Badge></div>
            </Card>
          ))}
        </div>
      )}
      {activeTab === 'audit' && (
        <div className="space-y-3">
          <Card className="mb-4">
            <h3 className="font-semibold mb-2">Submit utilization report</h3>
            <p className="text-sm text-slate-600 mb-3">Starts approval workflow: CSR Head → Finance → Compliance</p>
            <Button
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true)
                try {
                  const res = await submitNgoReport('Q4 Utilization Report')
                  setLastWorkflow(res.data?.workflow)
                } finally {
                  setSubmitting(false)
                }
              }}
            >
              {submitting ? 'Submitting…' : 'Submit Q4 Report for Approval'}
            </Button>
            {lastWorkflow && (
              <p className="text-sm text-slate-600 mt-3 flex items-center gap-2">
                Workflow started <WorkflowStatusBadge status={lastWorkflow.status} />
              </p>
            )}
          </Card>
          {ngoFinance.auditDocs.map((d) => (
            <Card key={d.id} className="flex justify-between items-center">
              <div><p className="font-medium">{d.name}</p><p className="text-sm text-slate-500">{d.date || 'Pending upload'}</p></div>
              <Badge variant={d.status === 'verified' ? 'verified' : 'warning'}>{d.status}</Badge>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
