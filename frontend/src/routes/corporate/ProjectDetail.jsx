import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, MapPin, Sparkles, Upload } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { getProject, projectStatuses } from '../../data/corporate/projects'
import { CORPORATE_ROUTES } from '../../lib/routes'
import { formatINR } from '../../data/corporate/dashboard'
import NotFound from '../public/NotFound'

export default function ProjectDetail() {
  const { id } = useParams()
  const project = getProject(id)
  if (!project) return <NotFound />

  const status = projectStatuses[project.status] || projectStatuses.active

  return (
    <>
      <PageHeader
        title={project.name}
        breadcrumbs={[
          { label: 'Projects', href: CORPORATE_ROUTES.projects },
          { label: project.name },
        ]}
        actions={<Badge variant={status.variant}>{status.label}</Badge>}
      />

      {project.riskAlerts.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          {project.riskAlerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span><strong className="capitalize">{alert.level}:</strong> {alert.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-2">Project Overview</h3>
          <p className="text-slate-600 text-sm mb-4">{project.description}</p>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">NGO</dt><dd className="font-medium"><Link to={CORPORATE_ROUTES.ngoProfile(project.ngoSlug)} className="text-primary-600 hover:underline">{project.ngoName}</Link></dd></div>
            <div><dt className="text-slate-500">Theme</dt><dd className="font-medium">{project.theme}</dd></div>
            <div><dt className="text-slate-500">Schedule VII</dt><dd className="font-medium">{project.scheduleVII}</dd></div>
            <div><dt className="text-slate-500">Timeline</dt><dd className="font-medium">{project.startDate} → {project.endDate}</dd></div>
          </dl>
        </Card>
        <Card>
          <h3 className="font-semibold text-slate-900 mb-3">Funding Status</h3>
          <p className="text-2xl font-bold text-slate-900">{formatINR(project.spent)}</p>
          <p className="text-sm text-slate-500">of {formatINR(project.budget)} budget</p>
          <ProgressBar value={project.spent} max={project.budget} className="mt-3" />
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Milestones</h3>
          <div className="space-y-4">
            {project.milestones.map((m) => (
              <div key={m.id} className="flex gap-3">
                <div className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${
                  m.status === 'completed' ? 'bg-emerald-500' : m.status === 'delayed' ? 'bg-red-500' : m.status === 'in_progress' ? 'bg-primary-500' : 'bg-slate-300'
                }`} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-900">{m.title}</span>
                    <Badge variant={m.status === 'completed' ? 'verified' : m.status === 'delayed' ? 'warning' : 'default'}>{m.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">Due: {m.due}</p>
                  {m.progress > 0 && m.progress < 100 && <ProgressBar value={m.progress} showValue={false} className="mt-1" />}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">NGO Updates</h3>
          {project.updates.length === 0 ? (
            <p className="text-sm text-slate-500">No updates yet.</p>
          ) : (
            <ul className="space-y-3">
              {project.updates.map((u, i) => (
                <li key={i} className="border-l-2 border-primary-200 pl-3">
                  <p className="text-xs text-slate-500">{u.date} · {u.author}</p>
                  <p className="text-sm text-slate-700 mt-0.5">{u.text}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-3">Beneficiary Metrics</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Direct</dt><dd className="font-medium">{project.beneficiaries.direct.toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Indirect</dt><dd className="font-medium">{project.beneficiaries.indirect.toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Households</dt><dd className="font-medium">{project.beneficiaries.households.toLocaleString()}</dd></div>
          </dl>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-3">KPIs</h3>
          {project.kpis.map((kpi, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">{kpi.label}</span>
                <span className="font-medium">{kpi.actual}{kpi.unit || ''} / {kpi.target}{kpi.unit || ''}</span>
              </div>
              <ProgressBar value={kpi.actual} max={kpi.target} showValue={false} />
            </div>
          ))}
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary-600" /> AI Insights</h3>
          <ul className="space-y-2">
            {project.aiInsights.map((insight, i) => (
              <li key={i} className="text-sm text-slate-600">• {insight}</li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-3">Evidence Upload</h3>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Drag files here or click to upload</p>
            <Button variant="secondary" size="sm" className="mt-3">Choose Files</Button>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><MapPin className="h-4 w-4" /> Geographic Reach</h3>
          <div className="rounded-lg bg-slate-100 h-40 flex items-center justify-center text-slate-500 text-sm mb-3">
            Map placeholder — {project.location}
          </div>
          <ul className="space-y-1 text-sm">
            {project.geoPoints.map((pt, i) => (
              <li key={i} className="text-slate-600">{pt.label}: {pt.lat.toFixed(2)}, {pt.lng.toFixed(2)}</li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
