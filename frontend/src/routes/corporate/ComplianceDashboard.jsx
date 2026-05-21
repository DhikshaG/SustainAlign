import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, FileDown, ShieldCheck, Settings, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { StatCard } from '../../components/corporate/StatCard'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Alert } from '../../components/ui/Alert'
import { PieChartCard } from '../../components/corporate/Charts'
import { ComplianceAssistant } from '../../components/corporate/ComplianceAssistant'
import { formatINR } from '../../data/corporate/dashboard'
import {
  fetchComplianceSummary,
  updateComplianceProfile,
  acknowledgeAlert,
  fetchMcaExport,
  runComplianceCheck,
  fyToPeriod,
  downloadJson,
} from '../../lib/compliance'
import { generateReport } from '../../lib/reporting'
import { api } from '../../lib/api'
import { CORPORATE_ROUTES } from '../../lib/routes'

const statusBadge = { pass: 'verified', warn: 'warning', fail: 'warning' }

export default function ComplianceDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [showMca, setShowMca] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [checking, setChecking] = useState(false)
  const [profileForm, setProfileForm] = useState({})

  const loadSummary = useCallback(() => {
    return fetchComplianceSummary()
      .then((d) => { setData(d); setError(null); return d })
      .catch((err) => { setError(err.message); throw err })
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  async function downloadPdf(type, filename) {
    if (!data) return
    setGenerating(true)
    try {
      const { periodStart, periodEnd } = fyToPeriod(data.section135.fy)
      const report = await generateReport({ type, periodStart, periodEnd })
      if (report.downloadUrl) {
        const blob = await api.download(report.downloadUrl)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      setError(err.message || 'Failed to generate PDF')
    } finally {
      setGenerating(false)
    }
  }

  async function downloadMcaJson() {
    try {
      const json = await fetchMcaExport()
      downloadJson(`mca-csr2-${data?.section135?.fy?.replace(/\s+/g, '-') || 'export'}.json`, json)
    } catch (err) {
      setError(err.message || 'MCA export failed')
    }
  }

  async function handleAcknowledge(id) {
    try {
      await acknowledgeAlert(id)
      await loadSummary()
    } catch (err) {
      setError(err.message || 'Failed to acknowledge alert')
    }
  }

  async function handleRunCheck() {
    setChecking(true)
    try {
      await runComplianceCheck()
      await loadSummary()
    } catch (err) {
      setError(err.message || 'Compliance check failed')
    } finally {
      setChecking(false)
    }
  }

  function openProfileEditor() {
    if (!data) return
    setProfileForm({
      netProfitInr: data.section135.netProfit,
      turnoverInr: data.section135.turnover,
      netWorthInr: data.section135.netWorth,
      adminCapPct: 5,
      carryForwardInr: data.spend.carryForward,
    })
    setShowProfile(true)
  }

  async function saveProfile(e) {
    e.preventDefault()
    try {
      await updateComplianceProfile({
        netProfitInr: Number(profileForm.netProfitInr),
        turnoverInr: Number(profileForm.turnoverInr),
        netWorthInr: Number(profileForm.netWorthInr),
        adminCapPct: Number(profileForm.adminCapPct),
        carryForwardInr: Number(profileForm.carryForwardInr),
      })
      setShowProfile(false)
      await loadSummary()
    } catch (err) {
      setError(err.message || 'Profile update failed')
    }
  }

  if (error && !data) return <div className="p-6"><Alert variant="error">{error}</Alert></div>
  if (!data) return <p className="text-sm text-slate-500 p-6">Loading compliance data…</p>

  const { section135, spend, dueDates, scheduleVIIValidation, auditReadiness, alerts, mcaReportPreview } = data
  const spendPie = spend.breakdown.map((b) => ({ name: b.category, value: b.amount }))
  const criteria = section135.criteria || {}

  return (
    <>
      <PageHeader
        title="Compliance Dashboard"
        description="Section 135 obligation, Schedule VII validation, alerts, and MCA/board exports."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handleRunCheck} disabled={checking}>
              <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking…' : 'Run check'}
            </Button>
            <Button variant="secondary" size="sm" onClick={openProfileEditor}>
              <Settings className="h-4 w-4" /> Edit profile
            </Button>
            <Button size="sm" onClick={() => setShowMca(true)}>
              <FileDown className="h-4 w-4" /> MCA Report
            </Button>
          </div>
        }
      />

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="CSR Obligation (2%)" value={formatINR(section135.csrObligation)} subtext={section135.fy} icon={ShieldCheck} />
        <StatCard label="Total Spent" value={formatINR(spend.spent)} subtext={`Admin: ${formatINR(spend.administrative)}`} />
        <StatCard label="Unspent CSR" value={formatINR(spend.unspent)} subtext={`Carry-forward: ${formatINR(spend.carryForward)}`} />
        <StatCard label="Audit Readiness" value={`${auditReadiness.score}/100`} subtext="Compliance score" />
      </div>

      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-3">Obligation Calculator</h3>
        <p className="text-sm text-slate-600 mb-3">{section135.obligationBreakdown?.formula}</p>
        <div className="grid sm:grid-cols-3 gap-4 text-sm mb-4">
          <div><span className="text-slate-500">Avg net profit</span><p className="font-medium">{formatINR(section135.averageNetProfit ?? section135.netProfit)}</p></div>
          <div><span className="text-slate-500">Rate</span><p className="font-medium">{section135.obligationRate}%</p></div>
          <div><span className="text-slate-500">Result</span><p className="font-medium text-primary-700">{formatINR(section135.csrObligation)}</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={criteria.netWorthMet ? 'verified' : 'default'}>Net worth ≥ ₹500 Cr</Badge>
          <Badge variant={criteria.turnoverMet ? 'verified' : 'default'}>Turnover ≥ ₹1000 Cr</Badge>
          <Badge variant={criteria.netProfitMet ? 'verified' : 'default'}>Net profit ≥ ₹5 Cr</Badge>
          <Badge variant={section135.eligible ? 'verified' : 'warning'}>
            Section 135: {section135.eligible ? 'Applicable' : 'Not applicable'}
          </Badge>
        </div>
      </Card>

      {alerts.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Compliance Alerts
          </h3>
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-start gap-2 text-sm">
                <Badge variant={a.level === 'critical' ? 'warning' : 'default'}>{a.level}</Badge>
                <span className="text-slate-700 flex-1">
                  {a.message}
                  {a.entityType === 'project' && a.entityId && (
                    <> — <Link to={CORPORATE_ROUTES.projectDetail(a.entityId)} className="text-primary-600 hover:underline">View project</Link></>
                  )}
                </span>
                <span className="text-slate-400 shrink-0">{a.date}</span>
                <Button variant="ghost" size="sm" onClick={() => handleAcknowledge(a.id)}>Ack</Button>
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
            <div className="flex justify-between"><dt className="text-slate-500">Net Profit</dt><dd className="font-medium">{formatINR(section135.netProfit)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Turnover</dt><dd className="font-medium">{formatINR(section135.turnover)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Net Worth</dt><dd className="font-medium">{formatINR(section135.netWorth)}</dd></div>
          </dl>
        </Card>
        <PieChartCard title="Spend by Category" data={spendPie} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Filing Due Dates</h3>
          <ul className="space-y-2 text-sm">
            {dueDates.map((d) => (
              <li key={d.id} className="flex justify-between">
                <span className="text-slate-600">{d.title}</span>
                <span className="font-medium text-slate-900">{d.date}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Schedule VII Validation</h3>
          <ul className="space-y-3">
            {scheduleVIIValidation.map((v) => (
              <li key={v.item} className="text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-700">{v.item}</span>
                  <Badge variant={statusBadge[v.status] || 'default'}>{v.status}</Badge>
                </div>
                {v.note && <p className="text-xs text-slate-500 mt-1">{v.note}</p>}
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
        <ComplianceAssistant />
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
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowMca(false)}>Close</Button>
              <Button variant="secondary" onClick={downloadMcaJson}>Download JSON</Button>
              <Button onClick={() => downloadPdf('mca_csr2', 'mca-csr2-preview.pdf')} disabled={generating}>
                {generating ? 'Generating…' : 'Download PDF'}
              </Button>
              <Button variant="secondary" onClick={() => downloadPdf('board', 'board-csr-summary.pdf')} disabled={generating}>
                Board Report
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-w-lg w-full">
            <h3 className="font-semibold text-lg mb-4">Edit CSR Financial Profile</h3>
            <form onSubmit={saveProfile} className="space-y-3">
              <label className="block text-sm">
                <span className="text-slate-500">Net profit (INR)</span>
                <Input type="number" value={profileForm.netProfitInr} onChange={(e) => setProfileForm({ ...profileForm, netProfitInr: e.target.value })} className="mt-1" />
              </label>
              <label className="block text-sm">
                <span className="text-slate-500">Turnover (INR)</span>
                <Input type="number" value={profileForm.turnoverInr} onChange={(e) => setProfileForm({ ...profileForm, turnoverInr: e.target.value })} className="mt-1" />
              </label>
              <label className="block text-sm">
                <span className="text-slate-500">Net worth (INR)</span>
                <Input type="number" value={profileForm.netWorthInr} onChange={(e) => setProfileForm({ ...profileForm, netWorthInr: e.target.value })} className="mt-1" />
              </label>
              <label className="block text-sm">
                <span className="text-slate-500">Admin cap (%)</span>
                <Input type="number" step="0.1" value={profileForm.adminCapPct} onChange={(e) => setProfileForm({ ...profileForm, adminCapPct: e.target.value })} className="mt-1" />
              </label>
              <label className="block text-sm">
                <span className="text-slate-500">Carry-forward unspent (INR)</span>
                <Input type="number" value={profileForm.carryForwardInr} onChange={(e) => setProfileForm({ ...profileForm, carryForwardInr: e.target.value })} className="mt-1" />
              </label>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowProfile(false)}>Cancel</Button>
                <Button type="submit">Save & recalculate</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  )
}
