import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Eye, Download, Sparkles } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Select } from '../../components/ui/Select'
import { Checkbox } from '../../components/ui/Checkbox'
import { Label } from '../../components/ui/Label'
import { CORPORATE_ROUTES } from '../../lib/routes'
import { fyToPeriod } from '../../lib/compliance'
import { api } from '../../lib/api'
import {
  fetchReports,
  previewReport,
  generateReport,
  downloadReportFile,
  REPORT_TYPES,
  REPORT_FORMATS,
  FY_OPTIONS,
} from '../../lib/reporting'

export default function ReportGenerator() {
  const [type, setType] = useState('quarterly')
  const [format, setFormat] = useState('pdf')
  const [fy, setFy] = useState('FY 2025-26')
  const [includeAi, setIncludeAi] = useState(true)
  const [preview, setPreview] = useState(null)
  const [reports, setReports] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const { periodStart, periodEnd } = fyToPeriod(fy)

  useEffect(() => {
    let cancelled = false
    fetchReports().then((data) => {
      if (!cancelled) setReports(data)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  function handleTypeChange(nextType) {
    setType(nextType)
    if (nextType === 'board') setFormat('pptx')
  }

  async function handlePreview() {
    setLoading(true)
    setError(null)
    try {
      const doc = await previewReport({ type, periodStart, periodEnd, includeAi })
      setPreview(doc)
    } catch (err) {
      setError(err.message || 'Preview failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const report = await generateReport({
        type,
        format,
        periodStart,
        periodEnd,
        includeAi,
      })
      await downloadReportFile(report, api)
      setReports(await fetchReports())
      if (report.offline) {
        setPreview((p) => p ? { ...p, offline: true } : p)
      }
    } catch (err) {
      setError(err.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <PageHeader
        title="AI Report Generator"
        description="Generate executive summaries, impact stories, quarterly reports, and board presentations from live project data."
        breadcrumbs={[
          { label: 'Reporting', href: CORPORATE_ROUTES.reporting },
          { label: 'Report Generator' },
        ]}
      />

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary-600" />
            Report Settings
          </h3>

          <div className="space-y-4">
            <div>
              <Label htmlFor="report-type">Report type</Label>
              <Select id="report-type" value={type} onChange={(e) => handleTypeChange(e.target.value)} className="mt-1">
                {REPORT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="report-format">Export format</Label>
              <Select id="report-format" value={format} onChange={(e) => setFormat(e.target.value)} className="mt-1">
                {REPORT_FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="report-fy">Financial year</Label>
              <Select id="report-fy" value={fy} onChange={(e) => setFy(e.target.value)} className="mt-1">
                {FY_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </Select>
              <p className="text-xs text-slate-500 mt-1">{periodStart} — {periodEnd}</p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={includeAi} onChange={(e) => setIncludeAi(e.target.checked)} />
              Include AI-generated narrative
            </label>

            <div className="flex flex-col gap-2 pt-2">
              <Button variant="secondary" onClick={handlePreview} disabled={loading}>
                <Eye className="h-4 w-4" />
                {loading ? 'Loading preview…' : 'Preview'}
              </Button>
              <Button onClick={handleGenerate} disabled={generating}>
                <Download className="h-4 w-4" />
                {generating ? 'Generating…' : 'Generate & Download'}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-4">Preview</h3>
          {!preview && (
            <p className="text-sm text-slate-500">
              Select options and click Preview to see report sections before exporting.
            </p>
          )}
          {preview?.offline && (
            <Alert variant="warning" className="mb-4">
              AI is offline — preview/export uses deterministic content from live data.
            </Alert>
          )}
          {preview?.sections?.map((section) => (
            <div key={section.id} className="mb-6 pb-4 border-b border-slate-100 last:border-0">
              <h4 className="font-medium text-slate-900 mb-2">{section.heading}</h4>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{section.body}</p>
              {section.bullets?.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-sm text-slate-600 space-y-1">
                  {section.bullets.slice(0, 6).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Card>
      </div>

      {reports.length > 0 && (
        <Card className="mt-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Recent Reports
          </h3>
          <ul className="space-y-2">
            {reports.slice(0, 10).map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-slate-500">{r.periodStart} — {r.periodEnd}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{(r.format || 'pdf').toUpperCase()}</Badge>
                  <Badge variant={r.status === 'submitted' ? 'verified' : 'default'}>{r.status}</Badge>
                  {r.downloadUrl && (
                    <Button variant="ghost" size="sm" onClick={() => downloadReportFile(r, api)}>
                      Download
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6">
        <Button as={Link} to={CORPORATE_ROUTES.reporting} variant="ghost">
          ← Back to Reporting
        </Button>
      </div>
    </>
  )
}
