import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { Card } from '../../components/ui/Card'
import { Alert } from '../../components/ui/Alert'
import { PieChartCard } from '../../components/corporate/Charts'
import { formatINR } from '../../data/corporate/dashboard'
import { fetchFundAllocation } from '../../lib/compliance'

export default function FundAllocation() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    fetchFundAllocation()
      .then((d) => { if (active) { setData(d); setError(null) } })
      .catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [])

  if (error) return <div className="p-6"><Alert variant="error">{error}</Alert></div>
  if (!data) return <p className="text-sm text-slate-500 p-6">Loading fund allocation…</p>

  const themePie = (data.categories || []).map((t) => ({
    name: t.theme,
    value: t.allocated,
  }))

  return (
    <>
      <PageHeader
        title="Fund Allocation"
        description="CSR obligation vs project budgets from live project data."
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card><p className="text-sm text-slate-500">2% Obligation</p><p className="text-2xl font-bold">{formatINR(data.obligation)}</p></Card>
        <Card><p className="text-sm text-slate-500">Allocated to Projects</p><p className="text-2xl font-bold">{formatINR(data.totalBudget)}</p></Card>
        <Card><p className="text-sm text-slate-500">Spent</p><p className="text-2xl font-bold">{formatINR(data.totalSpent)}</p></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <PieChartCard title="Allocation by Theme" data={themePie} />
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Projects</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {(data.projects || []).map((p) => (
              <div key={p.id} className="flex justify-between text-sm py-2 border-b border-slate-100">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-slate-500">{p.ngo} · {p.theme}</p>
                </div>
                <div className="text-right">
                  <p>{formatINR(p.spent)} / {formatINR(p.budget)}</p>
                  <p className="text-xs text-slate-400">{p.status}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
