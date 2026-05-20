import { useState } from 'react'
import { AlertTriangle, FileDown, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { StatCard } from '../../components/corporate/StatCard'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PieChartCard } from '../../components/corporate/Charts'
import { complianceSummary } from '../../data/corporate/compliance'
import { formatINR } from '../../data/corporate/dashboard'

const statusBadge = { pass: 'verified', warn: 'warning', fail: 'warning' }

export default function ComplianceDashboard() {
  const [showMca, setShowMca] = useState(false)
  const { section135, spend, dueDates, scheduleVIIValidation, auditReadiness, alerts, mcaReportPreview } = complianceSummary

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
            <div className="flex justify-between"><dt className="text-slate-500">Eligible</dt><dd><Badge variant="verified">Yes</Badge></dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Net Profit (avg)</dt><dd className="font-medium">{formatINR(section135.netProfit)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Obligation Rate</dt><dd className="font-medium">{section135.obligationRate}%</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Net Worth</dt><dd className="font-medium">{formatINR(section135.netWorth)}</dd></div>
          </dl>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-2">Spend vs Obligation</p>
            <ProgressBar value={spend.spent} max={section135.csrObligation * 1.5} label="Including carry-forward spend" />
          </div>
        </Card>

        <PieChartCard title="Spend by Schedule VII Category" data={spendPie} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Due Dates</h3>
          <ul className="space-y-3">
            {dueDates.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-900">{d.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{d.date}</span>
                  <Badge variant={d.status === 'overdue' ? 'warning' : 'primary'}>{d.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Schedule VII Validation</h3>
          <ul className="space-y-3">
            {scheduleVIIValidation.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Badge variant={statusBadge[item.status]}>{item.status}</Badge>
                <div>
                  <p className="text-slate-900">{item.item}</p>
                  {item.note && <p className="text-slate-500 text-xs mt-0.5">{item.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Audit Readiness Checklist</h3>
        <ProgressBar value={auditReadiness.score} label="Overall score" className="mb-4" />
        <ul className="grid sm:grid-cols-2 gap-2">
          {auditReadiness.checklist.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className={item.done ? 'text-emerald-600' : 'text-slate-400'}>{item.done ? '✓' : '○'}</span>
              <span className={item.done ? 'text-slate-700' : 'text-slate-500'}>{item.item}</span>
            </li>
          ))}
        </ul>
      </Card>

      {showMca && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <h3 className="font-semibold text-slate-900 mb-4">MCA CSR-2 Report Preview</h3>
            <div className="rounded-lg bg-slate-50 p-4 text-sm space-y-2 font-mono">
              <p>Company: {mcaReportPreview.companyName}</p>
              <p>CIN: {mcaReportPreview.cin}</p>
              <p>Financial Year: {mcaReportPreview.fy}</p>
              <p>Total CSR Spend: {formatINR(mcaReportPreview.totalCSR)}</p>
              <p>Unspent Amount: {formatINR(mcaReportPreview.unspent)}</p>
              <p>Number of Projects: {mcaReportPreview.projects}</p>
            </div>
            <p className="text-xs text-slate-500 mt-3">Demo preview — full PDF export in Phase 2.</p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowMca(false)}>Close</Button>
              <Button onClick={() => setShowMca(false)}>Download PDF</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
