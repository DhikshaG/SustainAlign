import { useEffect, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { StatCard } from '../../components/corporate/StatCard'
import { DataTable } from '../../components/corporate/DataTable'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { PieChartCard, BarChartCard, AreaChartCard } from '../../components/corporate/Charts'
import { formatINR } from '../../data/corporate/dashboard'
import { fetchReportingOverview } from '../../lib/impact'
import { generateReport, fetchReports } from '../../lib/reporting'
import { fyToPeriod } from '../../lib/compliance'
import { api } from '../../lib/api'

function downloadCsv(filename, rows) {
  const csv = rows.map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReportingAnalytics() {
  const [data, setData] = useState(null)
  const [reports, setReports] = useState([])
  const [error, setError] = useState(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([fetchReportingOverview(), fetchReports()])
      .then(([overview, reportList]) => {
        if (!active) return
        setData(overview)
        setReports(reportList)
        setError(null)
      })
      .catch((err) => { if (active) setError(err.message || 'Failed to load reporting data') })
    return () => { active = false }
  }, [])

  if (error && !data) return <div className="p-6"><Alert variant="error">{error}</Alert></div>
  if (!data) return <p className="text-sm text-slate-500 p-6">Loading reporting data…</p>

  const { impactSummary, sdgMapping, categoryAnalytics, geoAnalytics, budgetUtilization, ngoPerformance } = data
  const { periodStart, periodEnd } = fyToPeriod()

  async function downloadPdf(type) {
    setGenerating(true)
    try {
      const report = await generateReport({ type, periodStart, periodEnd })
      if (report.downloadUrl) {
        const blob = await api.download(report.downloadUrl)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-report.pdf`
        a.click()
        URL.revokeObjectURL(url)
        setReports(await fetchReports())
      }
    } catch (err) {
      setError(err.message || 'PDF generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function downloadExistingReport(report) {
    if (!report.downloadUrl) return
    const blob = await api.download(report.downloadUrl)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.type}-${report.periodStart}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const ngoColumns = [
    { key: 'ngo', label: 'NGO', sortable: true },
    { key: 'score', label: 'Score', sortable: true },
    { key: 'onTime', label: 'On-time %', sortable: true },
    { key: 'impact', label: 'Impact', sortable: true },
  ]

  return (
    <>
      <PageHeader
        title="Reporting & Analytics"
        description="Impact dashboards, SDG mapping, and downloadable CSR reports."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" disabled={generating} onClick={() => downloadPdf('quarterly')}>
              <FileText className="h-4 w-4" /> Quarterly
            </Button>
            <Button variant="secondary" size="sm" disabled={generating} onClick={() => downloadPdf('board')}>
              <FileText className="h-4 w-4" /> Board
            </Button>
            <Button variant="secondary" size="sm" disabled={generating} onClick={() => downloadPdf('sdg')}>
              <FileText className="h-4 w-4" /> SDG
            </Button>
            <Button variant="secondary" size="sm" disabled={generating} onClick={() => downloadPdf('impact')}>
              <FileText className="h-4 w-4" /> Impact
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadCsv('csr-impact-report.csv', [
                ['Metric', 'Value'],
                ['Total Beneficiaries', impactSummary.totalBeneficiaries],
                ['Active Projects', impactSummary.projectsActive],
                ['SDGs Covered', impactSummary.sdgsCovered],
              ])}
            >
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        }
      />

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Beneficiaries" value={impactSummary.totalBeneficiaries.toLocaleString()} />
        <StatCard label="Active Projects" value={impactSummary.projectsActive} />
        <StatCard label="SDGs Covered" value={impactSummary.sdgsCovered} />
        <StatCard label="CO₂ Offset (tons)" value={impactSummary.co2Offset.toLocaleString()} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <PieChartCard title="CSR Category Analytics" data={categoryAnalytics} />
        <BarChartCard
          title="Geographic Analytics (Spend by State)"
          data={geoAnalytics}
          xKey="state"
          bars={[{ key: 'spend', color: '#059669', name: 'Spend (INR)' }]}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <AreaChartCard
          title="Budget Utilization"
          data={budgetUtilization}
          lines={[
            { key: 'budget', color: '#94a3b8', name: 'Budget' },
            { key: 'utilized', color: '#059669', name: 'Utilized' },
          ]}
        />
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">SDG Mapping</h3>
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {sdgMapping.map((s) => (
              <li key={s.sdg} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                <span>SDG {s.sdg}: {s.label}</span>
                <span className="text-slate-500">{s.projects} projects · {formatINR(s.spend)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">NGO Performance</h3>
        <DataTable columns={ngoColumns} data={ngoPerformance} keyField="ngo" />
      </Card>

      {reports.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Generated Reports</h3>
          <ul className="space-y-2">
            {reports.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-slate-500">{r.periodStart} — {r.periodEnd}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.status === 'submitted' ? 'verified' : 'default'}>{r.status}</Badge>
                  {r.downloadUrl && (
                    <Button variant="ghost" size="sm" onClick={() => downloadExistingReport(r)}>Download</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
