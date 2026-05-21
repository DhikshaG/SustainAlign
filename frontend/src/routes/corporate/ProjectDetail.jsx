import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPin, Download, FileText, Image, Film } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { MediaGallery } from '../../components/corporate/MediaGallery'
import { TabbedSections } from '../../components/corporate/TabbedSections'
import { FileUploadZone } from '../../components/uploads/FileUploadZone'
import { MessageThreadView } from '../../components/crm/MessageThreadView'
import { TaskList } from '../../components/crm/TaskList'
import { ProjectTimeline } from '../../components/crm/ProjectTimeline'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Input } from '../../components/ui/Input'
import { FormField } from '../../components/ui/FormField'
import { projectStatuses } from '../../data/corporate/projects'
import { CORPORATE_ROUTES } from '../../lib/routes'
import { formatINR } from '../../data/corporate/dashboard'
import { fetchProject, postProjectUpdate } from '../../lib/projects'
import { addBeneficiaryLog, attachUpdateFiles } from '../../lib/impact'
import { postProjectUpdateSchema } from '../../lib/validation/schemas'
import { fetchProjectThread, postMessage } from '../../lib/messaging'
import { fetchProjectTasks, createProjectTask, updateProjectTask } from '../../lib/tasks'
import { fetchProjectTimeline } from '../../lib/crm'
import { api } from '../../lib/api'
import NotFound from '../public/NotFound'

function mimeIcon(mime) {
  if (mime?.startsWith('image/')) return Image
  if (mime?.startsWith('video/')) return Film
  return FileText
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'messages', label: 'Messages' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'timeline', label: 'Timeline' },
]

export default function ProjectDetail() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [project, setProject] = useState(null)
  const [loadedId, setLoadedId] = useState(null)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [updateText, setUpdateText] = useState('')
  const [updateFileIds, setUpdateFileIds] = useState([])
  const [updateError, setUpdateError] = useState(null)
  const [posting, setPosting] = useState(false)
  const [benForm, setBenForm] = useState({ directCount: '', indirectCount: '', note: '' })
  const [benSaving, setBenSaving] = useState(false)
  const [thread, setThread] = useState(null)
  const [threadLoading, setThreadLoading] = useState(false)
  const [threadError, setThreadError] = useState(null)
  const [sendingMsg, setSendingMsg] = useState(false)
  const [tasks, setTasks] = useState([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [timeline, setTimeline] = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)

  function handleTabChange(tab) {
    setActiveTab(tab)
    if (tab === 'messages') {
      setThreadLoading(true)
      setThread(null)
      setThreadError(null)
    }
    if (tab === 'tasks') setTasksLoading(true)
    if (tab === 'timeline') setTimelineLoading(true)
  }

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

  useEffect(() => {
    if (activeTab !== 'messages' || !project) return
    let active = true
    fetchProjectThread(id, 'corporate')
      .then((data) => { if (active) setThread(data) })
      .catch((err) => {
        if (active) {
          setThread(null)
          setThreadError(err.message || 'Messaging unavailable')
        }
      })
      .finally(() => { if (active) setThreadLoading(false) })
    return () => { active = false }
  }, [activeTab, id, project])

  useEffect(() => {
    if (activeTab !== 'tasks' || !project) return
    let active = true
    fetchProjectTasks(id, 'corporate')
      .then((data) => { if (active) setTasks(data) })
      .catch(() => { if (active) setTasks([]) })
      .finally(() => { if (active) setTasksLoading(false) })
    return () => { active = false }
  }, [activeTab, id, project])

  useEffect(() => {
    if (activeTab !== 'timeline' || !project) return
    let active = true
    fetchProjectTimeline(id, 'corporate')
      .then((data) => { if (active) setTimeline(data) })
      .catch(() => { if (active) setTimeline([]) })
      .finally(() => { if (active) setTimelineLoading(false) })
    return () => { active = false }
  }, [activeTab, id, project])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function refreshProject() {
    const data = await fetchProject(id)
    setProject(data)
    setLoadedId(id)
  }

  const loading = loadedId !== id && !error

  if (loading && !project) return <p className="text-sm text-slate-500 p-6">Loading project…</p>
  if (error || !project) {
    if (error) {
      return (
        <div className="p-6">
          <Alert variant="error">{error}</Alert>
          <Button variant="ghost" className="mt-2" onClick={() => {
            setLoadedId(null)
            refreshProject().catch((err) => setError(err.message))
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
  const pendingMilestoneReviews = milestones.filter((m) => m.reviewStatus === 'submitted')

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
      const update = await postProjectUpdate(id, parsed.data.body)
      if (updateFileIds.length && update?.id) {
        await attachUpdateFiles(id, update.id, updateFileIds, 'corporate')
      }
      setUpdateText('')
      setUpdateFileIds([])
      await refreshProject()
      showToast('Update posted')
    } catch (err) {
      setUpdateError(err.message || 'Failed to post update')
    } finally {
      setPosting(false)
    }
  }

  async function handleLogBeneficiaries(e) {
    e.preventDefault()
    const directCount = parseInt(benForm.directCount, 10)
    const indirectCount = parseInt(benForm.indirectCount, 10) || 0
    if (Number.isNaN(directCount) || directCount < 0) return
    setBenSaving(true)
    try {
      await addBeneficiaryLog(id, { directCount, indirectCount, note: benForm.note || undefined }, 'corporate')
      setBenForm({ directCount: '', indirectCount: '', note: '' })
      await refreshProject()
      showToast('Beneficiaries logged')
    } catch (err) {
      showToast(err.message || 'Failed to log beneficiaries')
    } finally {
      setBenSaving(false)
    }
  }

  async function downloadFile(item) {
    if (!item.downloadUrl) return
    try {
      const blob = await api.download(item.downloadUrl)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = item.name || 'download'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast('Download failed')
    }
  }

  async function handleSendMessage(body) {
    if (!thread?.id) return
    setSendingMsg(true)
    try {
      await postMessage(thread.id, body, 'corporate')
      const updated = await fetchProjectThread(id, 'corporate')
      setThread(updated)
    } finally {
      setSendingMsg(false)
    }
  }

  async function handleCreateTask(payload) {
    const task = await createProjectTask(id, payload, 'corporate')
    setTasks((prev) => [task, ...prev])
    showToast('Task created')
  }

  async function handleTaskStatusChange(taskId, status) {
    const updated = await updateProjectTask(id, taskId, { status }, 'corporate')
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)))
  }

  return (
    <>
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-3 text-sm shadow-lg">{toast}</div>
      )}
      <PageHeader
        title={project.name}
        breadcrumbs={[
          { label: 'Projects', href: CORPORATE_ROUTES.projects },
          { label: project.name },
        ]}
        actions={<Badge variant={status.variant}>{status.label}</Badge>}
      />

      {project.status === 'pending_ngo' && (
        <Alert variant="warning" className="mb-4">
          Waiting for NGO to accept the partnership request.
        </Alert>
      )}

      {pendingMilestoneReviews.length > 0 && (
        <Alert variant="primary" className="mb-4">
          {pendingMilestoneReviews.length} milestone(s) awaiting review.{' '}
          <Link to={CORPORATE_ROUTES.approvals} className="underline font-medium">Review in Approvals →</Link>
        </Alert>
      )}

      <TabbedSections tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === 'messages' && (
        <div className="mb-6">
          {threadError ? (
            <Alert variant="warning">{threadError}</Alert>
          ) : (
            <MessageThreadView
              thread={thread}
              loading={threadLoading}
              onSend={handleSendMessage}
              sending={sendingMsg}
            />
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="mb-6">
          <TaskList
            tasks={tasks}
            loading={tasksLoading}
            canCreate
            onCreate={handleCreateTask}
            onStatusChange={handleTaskStatusChange}
            defaultAssigneeSide="ngo"
          />
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="mb-6">
          <ProjectTimeline items={timeline} loading={timelineLoading} />
        </div>
      )}

      {activeTab === 'overview' && (
        <>
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
                        <div className="flex justify-between text-sm gap-2">
                          <span className="font-medium text-slate-900">{m.title}</span>
                          <div className="flex gap-1 shrink-0">
                            {m.reviewStatus && m.reviewStatus !== 'none' && (
                              <Badge variant={m.reviewStatus === 'approved' ? 'verified' : m.reviewStatus === 'submitted' ? 'warning' : 'default'}>
                                {m.reviewStatus}
                              </Badge>
                            )}
                            <Badge variant={m.status === 'completed' ? 'verified' : m.status === 'delayed' ? 'warning' : 'default'}>{m.status.replace('_', ' ')}</Badge>
                          </div>
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
                <ul className="space-y-4 mb-4">
                  {updates.map((u) => (
                    <li key={u.id || u.date} className="border-l-2 border-primary-200 pl-3">
                      <p className="text-xs text-slate-500">{u.date} · {u.author}</p>
                      <p className="text-sm text-slate-700 mt-0.5">{u.text || u.body}</p>
                      {(u.images?.length > 0) && (
                        <div className="mt-2">
                          <MediaGallery items={u.images} />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={handlePostUpdate} className="space-y-2 border-t border-slate-100 pt-4">
                {updateError && <Alert variant="error">{updateError}</Alert>}
                <Input placeholder="Post a progress note…" value={updateText} onChange={(e) => setUpdateText(e.target.value)} />
                <FileUploadZone
                  category="project_update"
                  entityType="project"
                  entityId={id}
                  label="Attach photos to update"
                  accept={['image/png', 'image/jpeg', 'image/webp']}
                  onUploaded={(file) => {
                    if (file?.id) setUpdateFileIds((ids) => [...ids, file.id])
                  }}
                />
                {updateFileIds.length > 0 && (
                  <p className="text-xs text-slate-500">{updateFileIds.length} file(s) ready to attach</p>
                )}
                <Button type="submit" size="sm" disabled={posting}>{posting ? 'Posting…' : 'Post Update'}</Button>
              </form>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <h3 className="font-semibold text-slate-900 mb-3">Evidence & Media</h3>
              <FileUploadZone
                category="project_evidence"
                entityType="project"
                entityId={id}
                label="Photos, reports, receipts"
                onUploaded={refreshProject}
              />
              {evidence.length > 0 && (
                <>
                  <MediaGallery items={evidence} className="mt-4" />
                  <ul className="mt-4 space-y-2 text-sm">
                    {evidence.map((e) => {
                      const Icon = mimeIcon(e.mime)
                      return (
                        <li key={e.id} className="flex items-center justify-between py-1">
                          <span className="flex items-center gap-2 text-slate-600 truncate">
                            <Icon className="h-4 w-4 shrink-0" />
                            {e.name} · {e.date}
                          </span>
                          {e.downloadUrl && (
                            <Button variant="ghost" size="sm" onClick={() => downloadFile(e)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </>
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

              <form onSubmit={handleLogBeneficiaries} className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <p className="text-sm font-medium text-slate-900">Log Beneficiaries</p>
                <FormField label="Direct">
                  <Input type="number" min="0" value={benForm.directCount} onChange={(e) => setBenForm((f) => ({ ...f, directCount: e.target.value }))} />
                </FormField>
                <FormField label="Indirect">
                  <Input type="number" min="0" value={benForm.indirectCount} onChange={(e) => setBenForm((f) => ({ ...f, indirectCount: e.target.value }))} />
                </FormField>
                <Button type="submit" size="sm" disabled={benSaving}>{benSaving ? 'Saving…' : 'Log'}</Button>
              </form>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
