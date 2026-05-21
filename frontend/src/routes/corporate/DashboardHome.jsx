import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, FolderKanban, ShieldCheck, Calendar, TrendingUp, Sparkles } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { StatCard } from '../../components/corporate/StatCard'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { PieChartCard, AreaChartCard, BarChartCard } from '../../components/corporate/Charts'
import { formatINR } from '../../data/corporate/dashboard'
import { CORPORATE_ROUTES } from '../../lib/routes'
import { fetchDashboardSummary } from '../../lib/impact'

export default function DashboardHome() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    fetchDashboardSummary()
      .then((d) => { if (active) { setData(d); setError(null) } })
      .catch((err) => { if (active) setError(err.message || 'Failed to load dashboard') })
    return () => { active = false }
  }, [])

  if (error) return <div className="p-6"><Alert variant="error">{error}</Alert></div>
  if (!data) return <p className="text-sm text-slate-500 p-6">Loading dashboard…</p>

  const { budget, spendProgress, activeProjects, complianceScore, deadlines, ngoPerformance, impactMetrics, aiRecommendations } = data

  const budgetPie = [
    { name: 'Spent', value: budget.spent },
    { name: 'Allocated (unspent)', value: Math.max(budget.allocated - budget.spent, 0) },
    { name: 'Unallocated', value: Math.max(budget.total - budget.allocated, 0) },
  ]

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your CSR program, compliance status, and impact."
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="CSR Budget" value={formatINR(budget.total)} subtext={`${formatINR(budget.spent)} spent`} icon={Wallet} />
        <StatCard label="Active Projects" value={activeProjects.count} subtext="Live from project data" icon={FolderKanban} />
        <StatCard label="Compliance Score" value={`${complianceScore}/100`} subtext="From compliance engine" icon={ShieldCheck} />
        <StatCard label="Spend Rate" value={`${budget.total ? Math.round((budget.spent / budget.total) * 100) : 0}%`} subtext="Of total CSR budget" icon={TrendingUp} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <PieChartCard title="CSR Budget Status" data={budgetPie} />
        <AreaChartCard
          title="Spend Progress vs Obligation"
          data={spendProgress}
          lines={[
            { key: 'spent', color: '#059669', name: 'Actual Spend' },
            { key: 'obligation', color: '#94a3b8', name: 'Cumulative Obligation' },
          ]}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-primary-600" />
            Active Projects
          </h3>
          <ul className="space-y-3">
            {(activeProjects.list || []).map((p) => (
              <li key={p.id}>
                <Link to={CORPORATE_ROUTES.projectDetail(p.id)} className="block hover:bg-slate-50 -mx-2 px-2 py-1 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-900 truncate">{p.name}</span>
                    <span className="text-slate-500 shrink-0 ml-2">{p.progress}%</span>
                  </div>
                  <ProgressBar value={p.progress} showValue={false} />
                  <p className="text-xs text-slate-500 mt-0.5">{p.ngo}</p>
                </Link>
              </li>
            ))}
          </ul>
          <Button as={Link} to={CORPORATE_ROUTES.projects} variant="ghost" size="sm" className="mt-4 w-full">
            View all projects
          </Button>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-600" />
            Upcoming Deadlines
          </h3>
          <ul className="space-y-3">
            {(deadlines || []).map((d) => (
              <li key={d.id} className="flex items-start gap-3 text-sm">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${d.urgent ? 'bg-red-500' : 'bg-amber-400'}`} />
                <div>
                  <p className="font-medium text-slate-900">{d.title}</p>
                  <p className="text-slate-500">{d.date} · {d.type}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-2">Compliance Score</h3>
          <ProgressBar value={complianceScore} label="Overall readiness" className="mb-4" />
          <Button as={Link} to={CORPORATE_ROUTES.compliance} variant="secondary" size="sm" className="mt-4 w-full">
            Open Compliance
          </Button>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <BarChartCard
          title="NGO Performance (Top 5)"
          data={(ngoPerformance || []).map((n) => ({ name: (n.name || n.ngo || '').split(' ')[0], score: n.score }))}
          bars={[{ key: 'score', color: '#059669', name: 'Score' }]}
        />
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Impact Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            {(impactMetrics || []).map((m) => (
              <div key={m.sdg} className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-medium text-primary-600">SDG {m.sdg}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{m.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {(aiRecommendations?.length > 0) && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary-600" />
            AI Recommendations
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {aiRecommendations.map((rec) => (
              <div key={rec.slug || rec.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-medium text-slate-900 text-sm">{rec.name || rec.title}</p>
                {rec.matchPercent != null && (
                  <Badge variant="primary" className="mt-1">{rec.matchPercent}% match</Badge>
                )}
                <p className="text-sm text-slate-600 mt-2">{rec.reason || rec.body}</p>
                {rec.slug ? (
                  <Button as={Link} to={CORPORATE_ROUTES.ngoProfile(rec.slug)} variant="link" size="sm" className="mt-2 p-0">
                    View NGO profile →
                  </Button>
                ) : rec.cta && (
                  <Button as={Link} to={rec.cta.href} variant="link" size="sm" className="mt-2 p-0">
                    {rec.cta.label} →
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}
