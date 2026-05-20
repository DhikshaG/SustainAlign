import { Link } from 'react-router-dom'
import { FolderKanban, Clock, Wallet, FileText, TrendingUp } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { StatCard } from '../../components/corporate/StatCard'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { Card } from '../../components/ui/Card'
import { PieChartCard } from '../../components/corporate/Charts'
import { ngoDashboardSummary, formatINR } from '../../data/ngo/dashboard'
import { NGO_ROUTES } from '../../lib/routes'

export default function NgoDashboardHome() {
  const { activeProjects, pendingApprovals, fundUtilization, upcomingReports, impactMetrics } = ngoDashboardSummary
  const fundPie = [
    { name: 'Spent', value: fundUtilization.spent },
    { name: 'Remaining', value: fundUtilization.allocated - fundUtilization.spent },
  ]

  return (
    <>
      <PageHeader title="NGO Dashboard" description="Overview of your projects, funding, and impact." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Projects" value={activeProjects.count} icon={FolderKanban} />
        <StatCard label="Pending Approvals" value={pendingApprovals.length} icon={Clock} />
        <StatCard label="Fund Utilization" value={`${fundUtilization.percent}%`} subtext={`${formatINR(fundUtilization.spent)} of ${formatINR(fundUtilization.allocated)}`} icon={Wallet} />
        <StatCard label="Reports Due" value={upcomingReports.length} icon={FileText} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <PieChartCard title="Fund Utilization" data={fundPie} />
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600" /> Impact Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            {impactMetrics.map((m) => (
              <div key={m.label} className="rounded-lg bg-emerald-50 p-4">
                <p className="text-xs text-emerald-700">SDG {m.sdg}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{m.value}</p>
                <p className="text-xs text-slate-500">{m.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Active Projects</h3>
          <ul className="space-y-3">
            {activeProjects.list.map((p) => (
              <li key={p.id}>
                <Link to={NGO_ROUTES.projectDetail(p.id)} className="block hover:bg-slate-50 -mx-2 px-2 py-1 rounded-lg">
                  <div className="flex justify-between text-sm mb-1"><span className="font-medium truncate">{p.name}</span><span>{p.progress}%</span></div>
                  <ProgressBar value={p.progress} showValue={false} />
                  <p className="text-xs text-slate-500 mt-0.5">{p.partner}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Pending Approvals</h3>
          <ul className="space-y-3 text-sm">
            {pendingApprovals.map((a) => (
              <li key={a.id} className="border-l-2 border-amber-400 pl-3">
                <p className="font-medium text-slate-900">{a.title}</p>
                <p className="text-slate-500">{a.project} · {a.date}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Upcoming Reports</h3>
          <ul className="space-y-3 text-sm">
            {upcomingReports.map((r) => (
              <li key={r.id} className="flex justify-between">
                <div><p className="font-medium text-slate-900">{r.title}</p><p className="text-slate-500">{r.type}</p></div>
                <span className="text-slate-600 shrink-0 ml-2">{r.due}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
