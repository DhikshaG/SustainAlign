import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { StatCard } from '../../components/corporate/StatCard'
import { Card } from '../../components/ui/Card'
import { Alert } from '../../components/ui/Alert'
import { fetchNgoBeneficiaryLogs } from '../../lib/impact'

export default function BeneficiaryTracking() {
  const [logs, setLogs] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    fetchNgoBeneficiaryLogs()
      .then((d) => { if (active) { setLogs(d); setError(null) } })
      .catch((err) => { if (active) setError(err.message || 'Failed to load beneficiaries') })
    return () => { active = false }
  }, [])

  const totalDirect = logs.reduce((s, l) => s + (l.direct || 0), 0)
  const totalIndirect = logs.reduce((s, l) => s + (l.indirect || 0), 0)

  return (
    <>
      <PageHeader title="Beneficiary Tracking" description="Beneficiary counts logged per CSR project." />
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Direct Beneficiaries" value={totalDirect.toLocaleString()} />
        <StatCard label="Indirect Beneficiaries" value={totalIndirect.toLocaleString()} />
        <StatCard label="Log Entries" value={logs.length} />
      </div>
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Beneficiary Logs</h3>
        {!logs.length && !error && <p className="text-sm text-slate-500">Loading…</p>}
        <div className="space-y-2">
          {logs.map((r) => (
            <div key={r.id} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
              <div>
                <p className="font-medium">{r.projectName}</p>
                <p className="text-slate-500">{r.note || '—'} · {r.recordedAt ? new Date(r.recordedAt).toLocaleDateString() : ''}</p>
              </div>
              <span className="font-semibold">{(r.direct + r.indirect).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
