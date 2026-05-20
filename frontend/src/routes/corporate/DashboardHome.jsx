import { Link } from 'react-router-dom'
import { Wallet, FolderKanban, ShieldCheck, Calendar, TrendingUp, Sparkles } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { StatCard } from '../../components/corporate/StatCard'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PieChartCard, AreaChartCard, BarChartCard } from '../../components/corporate/Charts'
import { dashboardSummary, formatINR } from '../../data/corporate/dashboard'
import { CORPORATE_ROUTES } from '../../lib/routes'

export default function DashboardHome() {
  const { budget, spendProgress, activeProjects, complianceScore, deadlines, ngoPerformance, impactMetrics, aiRecommendations } = dashboardSummary

  const budgetPie = [
    { name: 'Spent', value: budget.spent },
    { name: 'Allocated (unspent)', value: budget.allocated - budget.spent },
    { name: 'Unallocated', value: budget.total - budget.allocated },
  ]

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your CSR program, compliance status, and impact."
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="CSR Budget" value={formatINR(budget.total)} subtext={`${formatINR(budget.spent)} spent`} icon={Wallet} />
        <StatCard label="Active Projects" value={activeProjects.count} subtext="Across 6 states" icon={FolderKanban} />
        <StatCard label="Compliance Score" value={`${complianceScore}/100`} subtext="Audit readiness: 78%" icon={ShieldCheck} trend={{ positive: true, value: '+3 vs last quarter' }} />
        <StatCard label="Spend Rate" value={`${Math.round((budget.spent / budget.total) * 100)}%`} subtext="Of total CSR budget" icon={TrendingUp} />
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
            {activeProjects.list.map((p) => (
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
            {deadlines.map((d) => (
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
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Schedule VII</span><Badge variant="verified">Valid</Badge></div>
            <div className="flex justify-between"><span className="text-slate-500">MCA Filing</span><Badge variant="primary">Due Mar 31</Badge></div>
            <div className="flex justify-between"><span className="text-slate-500">Unspent CSR</span><Badge variant="warning">Action needed</Badge></div>
          </div>
          <Button as={Link} to={CORPORATE_ROUTES.compliance} variant="secondary" size="sm" className="mt-4 w-full">
            Open Compliance
          </Button>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <BarChartCard
          title="NGO Performance (Top 5)"
          data={ngoPerformance.map((n) => ({ name: n.name.split(' ')[0], score: n.score }))}
          bars={[{ key: 'score', color: '#059669', name: 'Score' }]}
        />
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Impact Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            {impactMetrics.map((m) => (
              <div key={m.sdg} className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-medium text-primary-600">SDG {m.sdg}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{m.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary-600" />
          AI Recommendations
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {aiRecommendations.map((rec) => (
            <div key={rec.id} className="rounded-lg border border-slate-200 p-4">
              <p className="font-medium text-slate-900 text-sm">{rec.title}</p>
              <p className="text-sm text-slate-600 mt-1">{rec.body}</p>
              <Button as={Link} to={rec.cta.href} variant="link" size="sm" className="mt-2 p-0">
                {rec.cta.label} →
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
