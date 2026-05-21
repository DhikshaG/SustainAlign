import { useEffect, useState } from 'react'
import { AlertTriangle, FileDown, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { StatCard } from '../../components/corporate/StatCard'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { PieChartCard } from '../../components/corporate/Charts'
import { formatINR } from '../../data/corporate/dashboard'
import { fetchComplianceSummary } from '../../lib/compliance'
import { generateReport } from '../../lib/reporting'
import { api } from '../../lib/api'

const statusBadge = { pass: 'verified', warn: 'warning', fail: 'warning' }

export default function ComplianceDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [showMca, setShowMca] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    let active = true
    fetchComplianceSummary()
      .then((d) => { if (active) { setData(d); setError(null) } })
      .catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [])

  async function downloadMcaPdf() {
    setGenerating(true)
    try {
      const report = await generateReport({
        type: 'mca_csr2',
        periodStart: '2025-04-01',
        periodEnd: '2026-03-31',
      })
      if (report.downloadUrl) {
        const blob = await api.download(report.downloadUrl)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'mca-csr2-preview.pdf'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      setError(err.message || 'Failed to generate PDF')
    } finally {
      setGenerating(false)
    }
  }

  if (error && !data) return <div className="p-6"><Alert variant="error">{error}</Alert></div>
  if (!data) return <p className="text-sm text-slate-500 p-6">Loading compliance data…</p>

  const { section135, spend, dueDates, scheduleVIIValidation, auditReadiness, alerts, mcaReportPreview } = data
  const spendPie = spend.breakdown.map((b) => ({ name: b.category, value: b.amount }))

  return (
    <>
      <PageHeader
        title="Compliance Dashboard"
        description="Section 135 status, spend tracking, Schedule VII validation, and audit readiness."
        actions={
          <Button onClick={() => setShowMca(true)}>
            <FileDown className="h-4 w-4" /> Generate MCA Report
          </Button>
        }
      />

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="CSR Obligation (2%)" value={formatINR(section135.csrObligation)} subtext={section135.fy} icon={ShieldCheck} />
        <StatCard label="Total Spent" value={formatINR(spend.spent)} subtext={`Admin: ${formatINR(spend.administrative)}`} />
        <StatCard label="Unspent CSR" value={formatINR(spend.unspent)} subtext={`Carry-forward: ${formatINR(spend.carryForward)}`} />
        <StatCard label="Audit Readiness" value={`${auditReadiness.score}/100`} subtext="Compliance score" />
      </div>

      {alerts.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /> Compliance Alerts</h3>
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-start gap-2 text-sm">
                <Badge variant={a.level === 'critical' ? 'warning' : 'default'}>{a.level}</Badge>
                <span className="text-slate-700">{a.message}</span>
                <span className="text-slate-400 ml-auto shrink-0">{a.date}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Section 135 Status</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Eligible</dt><dd><Badge variant={section135.eligible ? 'verified' : 'default'}>{section135.eligible ? 'Yes' : 'No'}</Badge></dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Net Profit (avg)</dt><dd className="font-medium">{formatINR(section135.netProfit)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Turnover</dt><dd className="font-medium">{formatINR(section135.turnover)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Obligation Rate</dt><dd className="font-medium">{section135.obligationRate}%</dd></div>
          </dl>
        </Card>
        <PieChartCard title="Spend by Category" data={spendPie} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Filing Due Dates</h3>
          <ul className="space-y-2 text-sm">
            {dueDates.map((d) => (
              <li key={d.label} className="flex justify-between">
                <span className="text-slate-600">{d.label}</span>
                <span className="font-medium text-slate-900">{d.date}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Schedule VII Validation</h3>
          <ul className="space-y-2">
            {scheduleVIIValidation.map((v) => (
              <li key={v.item} className="flex items-start justify-between gap-2 text-sm">
                <span className="text-slate-700">{v.item}</span>
                <Badge variant={statusBadge[v.status] || 'default'}>{v.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Audit Checklist</h3>
          <ProgressBar value={auditReadiness.score} label="Readiness score" className="mb-4" />
          <ul className="space-y-2 text-sm">
            {auditReadiness.checklist.map((c) => (
              <li key={c.item} className="flex justify-between">
                <span className="text-slate-600">{c.item}</span>
                <Badge variant={c.done ? 'verified' : 'default'}>{c.done ? 'Done' : 'Pending'}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {showMca && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-w-md w-full">
            <h3 className="font-semibold text-lg mb-2">MCA CSR-2 Preview</h3>
            <dl className="text-sm space-y-2 mb-4">
              <div className="flex justify-between"><dt className="text-slate-500">Company</dt><dd>{mcaReportPreview.companyName}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">FY</dt><dd>{mcaReportPreview.fy}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Total CSR</dt><dd>{formatINR(mcaReportPreview.totalCSR)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Unspent</dt><dd>{formatINR(mcaReportPreview.unspent)}</dd></div>
            </dl>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowMca(false)}>Close</Button>
              <Button onClick={downloadMcaPdf} disabled={generating}>{generating ? 'Generating…' : 'Download PDF'}</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
