import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { FileUploadZone } from '../../components/uploads/FileUploadZone'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Input } from '../../components/ui/Input'
import { projectStatuses } from '../../data/corporate/projects'
import { CORPORATE_ROUTES } from '../../lib/routes'
import { formatINR } from '../../data/corporate/dashboard'
import { fetchProject, postProjectUpdate } from '../../lib/projects'
import { postProjectUpdateSchema } from '../../lib/validation/schemas'
import NotFound from '../public/NotFound'

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loadedId, setLoadedId] = useState(null)
  const [error, setError] = useState(null)
  const [updateText, setUpdateText] = useState('')
  const [updateError, setUpdateError] = useState(null)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    let active = true
    fetchProject(id)
      .then((data) => {
        if (active) {
          setProject(data)
          setLoadedId(id)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Failed to load project')
          setProject(null)
          setLoadedId(id)
        }
      })
    return () => { active = false }
  }, [id])

  const loading = loadedId !== id && !error

  if (loading && !project) return <p className="text-sm text-slate-500 p-6">Loading project…</p>
  if (error || !project) {
    if (error) {
      return (
        <div className="p-6">
          <Alert variant="error">{error}</Alert>
          <Button variant="ghost" className="mt-2" onClick={() => {
            setLoadedId(null)
            fetchProject(id).then((data) => { setProject(data); setLoadedId(id); setError(null) }).catch((err) => setError(err.message))
          }}>Retry</Button>
        </div>
      )
    }
    return <NotFound />
  }

  const status = projectStatuses[project.status] || projectStatuses.active
  const milestones = project.milestones ?? []
  const updates = project.updates ?? []
  const evidence = project.evidence ?? project.files ?? []
  const budget = project.budget ?? project.budgetInr
  const spent = project.spent ?? project.spentInr ?? 0
  const ben = project.beneficiaries ?? { direct: 0, indirect: 0 }
  const kpis = project.kpis ?? []
  const geoUpdates = project.geoUpdates ?? []

  async function handlePostUpdate(e) {
    e.preventDefault()
    setUpdateError(null)
    const parsed = postProjectUpdateSchema.safeParse({ body: updateText })
    if (!parsed.success) {
      setUpdateError(parsed.error.errors[0]?.message)
      return
    }
    setPosting(true)
    try {
      await postProjectUpdate(id, parsed.data.body)
      setUpdateText('')
      const refreshed = await fetchProject(id)
      setProject(refreshed)
    } catch (err) {
      setUpdateError(err.message || 'Failed to post update')
    } finally {
      setPosting(false)
    }
  }

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

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-2">Project Overview</h3>
          <p className="text-slate-600 text-sm mb-4">{project.description || 'No description provided.'}</p>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">NGO</dt><dd className="font-medium">{project.ngoSlug ? <Link to={CORPORATE_ROUTES.ngoProfile(project.ngoSlug)} className="text-primary-600 hover:underline">{project.ngoName}</Link> : project.ngoName}</dd></div>
            <div><dt className="text-slate-500">Theme</dt><dd className="font-medium">{project.theme || '—'}</dd></div>
            <div><dt className="text-slate-500">Schedule VII</dt><dd className="font-medium">{project.scheduleVII || project.scheduleVii || '—'}</dd></div>
            <div><dt className="text-slate-500">Timeline</dt><dd className="font-medium">{project.startDate} → {project.endDate}</dd></div>
            <div><dt className="text-slate-500">Location</dt><dd className="font-medium">{project.location || '—'}</dd></div>
            <div><dt className="text-slate-500">Progress</dt><dd><ProgressBar value={project.progress ?? 0} /></dd></div>
          </dl>
        </Card>
        <Card>
          <h3 className="font-semibold text-slate-900 mb-3">Funding Status</h3>
          <p className="text-2xl font-bold text-slate-900">{formatINR(spent)}</p>
          <p className="text-sm text-slate-500">of {formatINR(budget)} budget</p>
          <ProgressBar value={spent} max={budget || 1} className="mt-3" />
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Milestones</h3>
          {milestones.length === 0 ? (
            <p className="text-sm text-slate-500">No milestones yet.</p>
          ) : (
            <div className="space-y-4">
              {milestones.map((m) => (
                <div key={m.id} className="flex gap-3">
                  <div className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${
                    m.status === 'completed' ? 'bg-emerald-500' : m.status === 'delayed' ? 'bg-red-500' : m.status === 'in_progress' ? 'bg-primary-500' : 'bg-slate-300'
                  }`} />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-900">{m.title}</span>
                      <Badge variant={m.status === 'completed' ? 'verified' : m.status === 'delayed' ? 'warning' : 'default'}>{m.status.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">Due: {m.due || m.dueDate}</p>
                    {m.progress > 0 && m.progress < 100 && <ProgressBar value={m.progress} showValue={false} className="mt-1" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Progress Updates</h3>
          {updates.length === 0 ? (
            <p className="text-sm text-slate-500 mb-4">No updates yet.</p>
          ) : (
            <ul className="space-y-3 mb-4">
              {updates.map((u) => (
                <li key={u.id || u.date} className="border-l-2 border-primary-200 pl-3">
                  <p className="text-xs text-slate-500">{u.date} · {u.author}</p>
                  <p className="text-sm text-slate-700 mt-0.5">{u.text || u.body}</p>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handlePostUpdate} className="space-y-2 border-t border-slate-100 pt-4">
            {updateError && <Alert variant="error">{updateError}</Alert>}
            <Input placeholder="Post a progress note…" value={updateText} onChange={(e) => setUpdateText(e.target.value)} />
            <Button type="submit" size="sm" disabled={posting}>{posting ? 'Posting…' : 'Post Update'}</Button>
          </form>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-3">Evidence Upload</h3>
          <FileUploadZone
            category="project_evidence"
            entityType="project"
            entityId={id}
            label="Photos, reports, receipts"
            onUploaded={async () => {
              const refreshed = await fetchProject(id)
              setProject(refreshed)
            }}
          />
          {evidence.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm">
              {evidence.map((e) => (
                <li key={e.id} className="text-slate-600">{e.name} · {e.date}</li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><MapPin className="h-4 w-4" /> Location & Impact</h3>
          <p className="text-sm text-slate-600 mb-2">{project.location || 'No location set'}</p>
          <p className="text-sm"><strong>Beneficiaries:</strong> {ben.direct?.toLocaleString()} direct · {ben.indirect?.toLocaleString()} indirect</p>
          {kpis.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              {kpis.slice(0, 4).map((k) => (
                <li key={k.id}>{k.label}: {k.value}{k.unit ? ` ${k.unit}` : ''}</li>
              ))}
            </ul>
          )}
          {geoUpdates.length > 0 && (
            <p className="text-xs text-slate-500 mt-2">Latest geo: {geoUpdates[0].district ? `${geoUpdates[0].district}, ` : ''}{geoUpdates[0].state}</p>
          )}
        </Card>
      </div>
    </>
  )
}
