import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, Users, Clock, FileText, Image } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { StatCard } from '../../components/corporate/StatCard'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { Card } from '../../components/ui/Card'
import { Alert } from '../../components/ui/Alert'
import { NGO_ROUTES } from '../../lib/routes'
import { fetchNgoDashboardSummary } from '../../lib/impact'

export default function NgoDashboardHome() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    fetchNgoDashboardSummary()
      .then((d) => { if (active) { setData(d); setError(null) } })
      .catch((err) => { if (active) setError(err.message || 'Failed to load dashboard') })
    return () => { active = false }
  }, [])

  if (error) return <div className="p-6"><Alert variant="error">{error}</Alert></div>
  if (!data) return <p className="text-sm text-slate-500 p-6">Loading dashboard…</p>

  const { activeProjects, totalProjects, totalBeneficiaries, pendingMilestones, recentUpdates, projects, mediaFeed } = data

  return (
    <>
      <PageHeader title="NGO Dashboard" description="Overview of your projects, funding, and impact." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Projects" value={activeProjects} subtext={`${totalProjects} total`} icon={FolderKanban} />
        <StatCard label="Total Beneficiaries" value={totalBeneficiaries.toLocaleString()} icon={Users} />
        <StatCard label="Pending Milestones" value={pendingMilestones} icon={Clock} />
        <StatCard label="Recent Updates (30d)" value={recentUpdates} icon={FileText} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-4">Active Projects</h3>
          <ul className="space-y-3">
            {(projects || []).map((p) => (
              <li key={p.id}>
                <Link to={NGO_ROUTES.projectDetail(p.id)} className="block hover:bg-slate-50 -mx-2 px-2 py-1 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium truncate">{p.name}</span>
                    <span>{p.progress}%</span>
                  </div>
                  <ProgressBar value={p.progress} showValue={false} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Image className="h-4 w-4 text-emerald-600" />
            Recent Media
          </h3>
          {(mediaFeed || []).length === 0 ? (
            <p className="text-sm text-slate-500">Upload photos on project updates to see them here.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {mediaFeed.map((m) => (
                <li key={m.id} className="border-b border-slate-100 pb-2 last:border-0">
                  <p className="font-medium truncate">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.projectName}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
