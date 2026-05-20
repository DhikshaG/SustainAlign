import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { StatCard } from '../../components/corporate/StatCard'
import { DataTable } from '../../components/corporate/DataTable'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { ngoBeneficiaries } from '../../data/ngo/beneficiaries'

export default function BeneficiaryTracking() {
  const [toast, setToast] = useState(null)
  const { summary, records, attendance, surveys, outcomes } = ngoBeneficiaries

  const attendanceCols = [
    { key: 'session', label: 'Session', sortable: true },
    { key: 'date', label: 'Date', sortable: true },
    { key: 'present', label: 'Present', sortable: true },
    { key: 'total', label: 'Total', sortable: true },
    { key: 'rate', label: 'Rate', render: (r) => `${Math.round((r.present / r.total) * 100)}%` },
  ]

  return (
    <>
      <PageHeader title="Beneficiary Tracking" description="Manage beneficiaries, attendance, surveys, and impact outcomes." />
      {toast && <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-3 text-sm shadow-lg">{toast}</div>}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Beneficiaries" value={summary.total.toLocaleString()} />
        <StatCard label="Households" value={summary.households.toLocaleString()} />
        <StatCard label="Surveys Completed" value={summary.surveysCompleted.toLocaleString()} />
      </div>
      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Add Beneficiary</h3>
        <form className="grid sm:grid-cols-4 gap-3" onSubmit={(e) => { e.preventDefault(); setToast('Beneficiary added — demo mode'); setTimeout(() => setToast(null), 3000) }}>
          <Input placeholder="Name / cluster" required />
          <Select defaultValue="individual"><option value="individual">Individual</option><option value="community">Community</option></Select>
          <Input placeholder="Count" type="number" required />
          <Button type="submit"><Plus className="h-4 w-4" /> Add</Button>
        </form>
      </Card>
      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Beneficiary Records</h3>
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r.id} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
              <div><p className="font-medium">{r.name}</p><p className="text-slate-500">{r.project} · {r.type}</p></div>
              <span className="font-semibold">{r.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Attendance Log</h3>
        <DataTable columns={attendanceCols} data={attendance} keyField="id" />
      </Card>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Surveys</h3>
          {surveys.map((s) => (
            <div key={s.id} className="mb-4 last:mb-0 pb-4 last:pb-0 border-b last:border-0 border-slate-100">
              <p className="font-medium">{s.title}</p>
              <p className="text-sm text-slate-500">{s.responses} responses · Avg {s.avgScore}/5 · {s.date}</p>
            </div>
          ))}
        </Card>
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Impact Outcomes</h3>
          {outcomes.map((o) => (
            <div key={o.metric} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
              <span className="text-slate-600">{o.metric}</span>
              <span><strong>{o.value}</strong> <span className="text-slate-400">/ {o.target}</span></span>
            </div>
          ))}
        </Card>
      </div>
    </>
  )
}
