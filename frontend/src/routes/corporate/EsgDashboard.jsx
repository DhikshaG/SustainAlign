import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf, Users, ShieldCheck, RefreshCw, Sparkles, Lightbulb } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { StatCard } from '../../components/corporate/StatCard'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { BarChartCard } from '../../components/corporate/Charts'
import { DataTable } from '../../components/corporate/DataTable'
import { formatINR } from '../../data/corporate/dashboard'
import { CORPORATE_ROUTES } from '../../lib/routes'
import { fetchUnifiedEsg, fetchEsgSummary, ESG_PILLARS } from '../../lib/esg'
import { useImpactPolling } from '../../hooks/useImpactPolling'

const PILLAR_ICONS = {
  environmental: Leaf,
  social: Users,
  governance: ShieldCheck,
}

const brsrColumns = [
  { key: 'principle', label: 'Principle', sortable: true, render: (row) => `P${row.principle}` },
  { key: 'title', label: 'Title', sortable: true },
  {
    key: 'coverage',
    label: 'Coverage',
    sortable: true,
    render: (row) => `${row.coverage}%`,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (row) => (
      <Badge variant={row.status === 'partial' ? 'primary' : 'default'}>{row.status.replace('_', ' ')}</Badge>
    ),
  },
  {
    key: 'indicators',
    label: 'Indicators',
    sortable: false,
    render: (row) => row.indicators?.length ?? 0,
  },
]

const projectColumns = [
  { key: 'name', label: 'Project', sortable: true },
  { key: 'theme', label: 'Theme', sortable: true },
  {
    key: 'pillar',
    label: 'Pillar',
    sortable: true,
    render: (row) => <Badge variant="default">{row.pillar}</Badge>,
  },
  {
    key: 'sdg',
    label: 'SDG',
    sortable: true,
    render: (row) => (row.sdg ? `SDG ${row.sdg}` : '—'),
  },
  {
    key: 'brsrPrinciples',
    label: 'BRSR',
    sortable: false,
    render: (row) => (row.brsrPrinciples?.length ? row.brsrPrinciples.map((p) => `P${p}`).join(', ') : '—'),
  },
  {
    key: 'spent',
    label: 'Spent',
    sortable: true,
    render: (row) => formatINR(row.spent),
  },
]

export default function EsgDashboard() {
  const navigate = useNavigate()
  const [activePillar, setActivePillar] = useState('environmental')
  const [aiSummary, setAiSummary] = useState(null)
  const [aiLoading, setAiLoading] = useState(true)
  const [aiOffline, setAiOffline] = useState(false)

  const fetchLive = useCallback(() => fetchUnifiedEsg(), [])
  const { data, error, loading, lastUpdated } = useImpactPolling(fetchLive)

  useEffect(() => {
    let cancelled = false
    fetchEsgSummary()
      .then((result) => {
        if (cancelled) return
        setAiSummary(result.summary)
        setAiOffline(!!result.offline)
      })
      .catch(() => {
        if (!cancelled) setAiOffline(true)
      })
      .finally(() => {
        if (!cancelled) setAiLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (error && !data) return <div className="p-6"><Alert variant="error">{error}</Alert></div>
  if (!data) return <p className="text-sm text-slate-500 p-6">Loading ESG dashboard…</p>

  const { pillars, sdgAlignment, brsr, sustainabilityKpis, csrSummary, projectMappings } = data
  const pillar = pillars[activePillar] || {}

  const pillarChartData = ESG_PILLARS.map((p) => ({
    name: p.label,
    score: pillars[p.id]?.score ?? 0,
    spend: pillars[p.id]?.spend ?? 0,
  }))

  const sdgChartData = (sdgAlignment || []).map((s) => ({
    name: `SDG ${s.sdg}`,
    spend: s.spend,
    beneficiaries: s.beneficiaries,
  }))

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <>
      <PageHeader
        title="ESG + CSR Dashboard"
        description="Unified environmental, social, and governance analytics mapped to SDGs and BRSR principles."
        actions={
          lastUpdatedLabel && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Last updated {lastUpdatedLabel}
            </span>
          )
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Environmental" value={`${pillars.environmental?.score ?? 0}/100`} subtext={formatINR(pillars.environmental?.spend ?? 0)} icon={Leaf} />
        <StatCard label="Social" value={`${pillars.social?.score ?? 0}/100`} subtext={formatINR(pillars.social?.spend ?? 0)} icon={Users} />
        <StatCard label="Governance" value={`${pillars.governance?.score ?? 0}/100`} subtext={`Audit ${pillars.governance?.auditReadiness ?? 0}%`} icon={ShieldCheck} />
        <StatCard label="CSR Obligation" value={formatINR(csrSummary.obligation)} subtext={`${formatINR(csrSummary.unallocated)} unallocated`} icon={Sparkles} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <BarChartCard
          title="ESG pillar scores"
          data={pillarChartData}
          xKey="name"
          bars={[{ key: 'score', color: '#059669', name: 'Score' }]}
        />
        <BarChartCard
          title="SDG alignment (spend)"
          data={sdgChartData}
          xKey="name"
          bars={[{ key: 'spend', color: '#6366f1', name: 'Spend (INR)' }]}
          height={240}
        />
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {ESG_PILLARS.map((p) => {
            const Icon = PILLAR_ICONS[p.id]
            return (
              <Button
                key={p.id}
                type="button"
                variant={activePillar === p.id ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActivePillar(p.id)}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {p.label}
              </Button>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <ProgressBar value={pillar.score ?? 0} label={`${pillar.score ?? 0}/100 score`} />
            <p className="text-sm text-slate-600 mt-3">
              {pillar.projectCount ?? 0} projects · {formatINR(pillar.spend ?? 0)} spend
            </p>
            <ul className="mt-4 space-y-2">
              {(pillar.highlights || []).map((h) => (
                <li key={h} className="text-sm text-slate-700 border-l-2 border-primary-200 pl-3">{h}</li>
              ))}
            </ul>
            {activePillar === 'governance' && pillar.deadlines?.length > 0 && (
              <ul className="mt-4 space-y-1 text-sm text-slate-600">
                {pillar.deadlines.map((d) => (
                  <li key={d.id}>{d.title} — {d.date}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Sustainability KPIs</h4>
            {(pillar.kpis?.length || sustainabilityKpis?.filter((k) => k.pillar === activePillar).length) ? (
              <ul className="space-y-2">
                {(pillar.kpis || sustainabilityKpis.filter((k) => k.pillar === activePillar)).map((k) => (
                  <li key={k.key || k.label} className="flex justify-between text-sm py-2 border-b border-slate-100">
                    <span>{k.label}</span>
                    <span className="font-medium">{k.value}{k.unit ? ` ${k.unit}` : ''}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No KPIs recorded for this pillar yet.</p>
            )}
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">BRSR principles coverage</h3>
        <DataTable columns={brsrColumns} data={brsr || []} keyField="principle" />
      </Card>

      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Project → ESG mapping</h3>
        <DataTable
          columns={projectColumns}
          data={projectMappings || []}
          keyField="id"
          onRowClick={(row) => navigate(CORPORATE_ROUTES.projectDetail(row.id))}
        />
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          AI ESG summary
        </h3>
        {aiOffline && (
          <Alert variant="warning" className="mb-3">
            AI summary unavailable (Ollama offline). Numeric ESG metrics above are still based on live data.
          </Alert>
        )}
        {aiLoading && !aiSummary && <p className="text-sm text-slate-500">Generating summary…</p>}
        {aiSummary && <p className="text-sm text-slate-700 leading-relaxed">{aiSummary}</p>}
        {!aiLoading && !aiSummary && !aiOffline && (
          <p className="text-sm text-slate-500">No summary available.</p>
        )}
        <div className="mt-4 flex gap-2">
          <Button as={Link} to={CORPORATE_ROUTES.reporting} variant="secondary" size="sm">
            Open reporting analytics
          </Button>
          <Button as={Link} to={CORPORATE_ROUTES.compliance} variant="ghost" size="sm">
            Compliance details
          </Button>
        </div>
      </Card>
    </>
  )
}
