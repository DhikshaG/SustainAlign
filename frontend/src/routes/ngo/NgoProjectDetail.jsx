import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FileUploadZone } from '../../components/uploads/FileUploadZone'
import { PageHeader } from '../../components/corporate/PageHeader'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { projectStatuses } from '../../data/corporate/projects'
import { NGO_ROUTES } from '../../lib/routes'
import { formatINR } from '../../data/ngo/dashboard'
import { fetchNgoProject, postNgoProjectUpdate, updateNgoMilestone } from '../../lib/projects'
import { postProjectUpdateSchema } from '../../lib/validation/schemas'
import NotFound from '../public/NotFound'

export default function NgoProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [milestoneDraft, setMilestoneDraft] = useState({})
  const [savingMilestones, setSavingMilestones] = useState(false)
  const [milestoneError, setMilestoneError] = useState(null)
  const [updateText, setUpdateText] = useState('')
  const [updateError, setUpdateError] = useState(null)
  const [posting, setPosting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchNgoProject(id)
      setProject(data)
      const draft = {}
      for (const m of data.milestones ?? []) {
        draft[m.id] = m.status
      }
      setMilestoneDraft(draft)
    } catch (err) {
      setError(err.message || 'Failed to load project')
      setProject(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <p className="text-sm text-slate-500 p-6">Loading project…</p>
  if (error || !project) {
    if (error) {
      return (
        <div className="p-6">
          <Alert variant="error">{error}</Alert>
          <Button variant="ghost" className="mt-2" onClick={load}>Retry</Button>
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

  async function handleSaveMilestones() {
    setMilestoneError(null)
    setSavingMilestones(true)
    try {
      for (const m of milestones) {
        const nextStatus = milestoneDraft[m.id]
        if (nextStatus && nextStatus !== m.status) {
          await updateNgoMilestone(id, m.id, {
            status: nextStatus,
            progress: nextStatus === 'completed' ? 100 : m.progress,
          })
        }
      }
      await load()
    } catch (err) {
      setMilestoneError(err.message || 'Failed to save milestones')
    } finally {
      setSavingMilestones(false)
    }
  }

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
      await postNgoProjectUpdate(id, parsed.data.body)
      setUpdateText('')
      await load()
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
        breadcrumbs={[{ label: 'Projects', href: NGO_ROUTES.projects }, { label: project.name }]}
        actions={<Badge variant={status.variant}>{status.label}</Badge>}
      />
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">Corporate Partner</dt><dd className="font-medium">{project.partner || project.corporateName}</dd></div>
            <div><dt className="text-slate-500">Budget</dt><dd className="font-medium">{formatINR(budget)}</dd></div>
            <div><dt className="text-slate-500">Spent</dt><dd className="font-medium">{formatINR(spent)}</dd></div>
            <div><dt className="text-slate-500">Progress</dt><dd><ProgressBar value={project.progress ?? 0} /></dd></div>
          </dl>
        </Card>
        <Card>
          <h3 className="font-semibold mb-3">Location</h3>
          <p className="text-lg font-medium">{project.location || '—'}</p>
          <p className="text-sm text-slate-500 mt-1">{project.theme || ''}</p>
        </Card>
      </div>
      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Milestones</h3>
        {milestoneError && <Alert variant="error" className="mb-3">{milestoneError}</Alert>}
        <div className="space-y-4">
          {milestones.map((m) => (
            <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-slate-100 pb-4 last:border-0">
              <div className="flex-1">
                <p className="font-medium text-sm">{m.title}</p>
                <p className="text-xs text-slate-500">Due: {m.due || m.dueDate}</p>
              </div>
              <Select
                className="w-40"
                value={milestoneDraft[m.id] ?? m.status}
                onChange={(e) => setMilestoneDraft((d) => ({ ...d, [m.id]: e.target.value }))}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </Select>
              <Badge variant={(milestoneDraft[m.id] ?? m.status) === 'completed' ? 'verified' : 'default'}>
                {(milestoneDraft[m.id] ?? m.status).replace('_', ' ')}
              </Badge>
            </div>
          ))}
        </div>
        {milestones.length > 0 && (
          <Button size="sm" className="mt-4" disabled={savingMilestones} onClick={handleSaveMilestones}>
            {savingMilestones ? 'Saving…' : 'Save Milestone Updates'}
          </Button>
        )}
      </Card>
      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Post Progress Update</h3>
        {updateError && <Alert variant="error" className="mb-3">{updateError}</Alert>}
        <form onSubmit={handlePostUpdate} className="flex gap-2">
          <Input placeholder="Share progress with your corporate partner…" value={updateText} onChange={(e) => setUpdateText(e.target.value)} className="flex-1" />
          <Button type="submit" disabled={posting}>{posting ? 'Posting…' : 'Post'}</Button>
        </form>
        {updates.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm border-t border-slate-100 pt-4">
            {updates.map((u) => (
              <li key={u.id || u.date}><span className="text-slate-500">{u.date}</span> — {u.text || u.body}</li>
            ))}
          </ul>
        )}
      </Card>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-3">Upload Evidence</h3>
          <FileUploadZone
            category="project_evidence"
            entityType="project"
            entityId={id}
            label="Photos, reports, receipts"
            onUploaded={() => load()}
          />
          {evidence.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm">{evidence.map((e) => <li key={e.id}>{e.name} · {e.date}</li>)}</ul>
          )}
        </Card>
        <Card>
          <h3 className="font-semibold mb-3">Expenses</h3>
          <p className="text-sm text-slate-500">Expense tracking coming in a future release.</p>
        </Card>
      </div>
      <div className="mt-6"><Button as={Link} to={NGO_ROUTES.projects} variant="ghost">← Back to Projects</Button></div>
    </>
  )
}
