import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FileUploadZone } from '../../components/uploads/FileUploadZone'
import { MediaGallery } from '../../components/corporate/MediaGallery'
import { PageHeader } from '../../components/corporate/PageHeader'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { FormField } from '../../components/ui/FormField'
import { projectStatuses } from '../../data/corporate/projects'
import { NGO_ROUTES } from '../../lib/routes'
import { formatINR } from '../../data/ngo/dashboard'
import { fetchNgoProject, postNgoProjectUpdate, updateNgoMilestone } from '../../lib/projects'
import {
  addBeneficiaryLog,
  addProjectKpi,
  addGeoUpdate,
  attachUpdateFiles,
} from '../../lib/impact'
import { postProjectUpdateSchema } from '../../lib/validation/schemas'
import NotFound from '../public/NotFound'

export default function NgoProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loadedId, setLoadedId] = useState(null)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [milestoneDraft, setMilestoneDraft] = useState({})
  const [savingMilestones, setSavingMilestones] = useState(false)
  const [milestoneError, setMilestoneError] = useState(null)
  const [updateText, setUpdateText] = useState('')
  const [updateFileIds, setUpdateFileIds] = useState([])
  const [updateError, setUpdateError] = useState(null)
  const [posting, setPosting] = useState(false)
  const [benForm, setBenForm] = useState({ directCount: '', indirectCount: '', note: '' })
  const [benError, setBenError] = useState(null)
  const [benSaving, setBenSaving] = useState(false)
  const [kpiForm, setKpiForm] = useState({ metricKey: '', label: '', value: '', unit: '' })
  const [kpiError, setKpiError] = useState(null)
  const [kpiSaving, setKpiSaving] = useState(false)
  const [geoForm, setGeoForm] = useState({ state: '', district: '', note: '' })
  const [geoError, setGeoError] = useState(null)
  const [geoSaving, setGeoSaving] = useState(false)

  useEffect(() => {
    let active = true
    fetchNgoProject(id)
      .then((data) => {
        if (!active) return
        setProject(data)
        setLoadedId(id)
        setError(null)
        const draft = {}
        for (const m of data.milestones ?? []) draft[m.id] = m.status
        setMilestoneDraft(draft)
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

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function refreshProject() {
    const data = await fetchNgoProject(id)
    setProject(data)
    setLoadedId(id)
    const draft = {}
    for (const m of data.milestones ?? []) draft[m.id] = m.status
    setMilestoneDraft(draft)
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
      await refreshProject()
      showToast('Milestones updated')
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
      const update = await postNgoProjectUpdate(id, parsed.data.body)
      if (updateFileIds.length && update?.id) {
        await attachUpdateFiles(id, update.id, updateFileIds, 'ngo')
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
    setBenError(null)
    const directCount = parseInt(benForm.directCount, 10)
    const indirectCount = parseInt(benForm.indirectCount, 10) || 0
    if (Number.isNaN(directCount) || directCount < 0) {
      setBenError('Enter a valid direct count')
      return
    }
    setBenSaving(true)
    try {
      await addBeneficiaryLog(id, { directCount, indirectCount, note: benForm.note || undefined }, 'ngo')
      setBenForm({ directCount: '', indirectCount: '', note: '' })
      await refreshProject()
      showToast('Beneficiaries logged')
    } catch (err) {
      setBenError(err.message || 'Failed to log beneficiaries')
    } finally {
      setBenSaving(false)
    }
  }

  async function handleAddKpi(e) {
    e.preventDefault()
    setKpiError(null)
    if (!kpiForm.metricKey || !kpiForm.label || !kpiForm.value) {
      setKpiError('Metric key, label, and value are required')
      return
    }
    setKpiSaving(true)
    try {
      await addProjectKpi(id, {
        metricKey: kpiForm.metricKey,
        label: kpiForm.label,
        value: kpiForm.value,
        unit: kpiForm.unit || undefined,
      }, 'ngo')
      setKpiForm({ metricKey: '', label: '', value: '', unit: '' })
      await refreshProject()
      showToast('KPI recorded')
    } catch (err) {
      setKpiError(err.message || 'Failed to add KPI')
    } finally {
      setKpiSaving(false)
    }
  }

  async function handleGeoUpdate(e) {
    e.preventDefault()
    setGeoError(null)
    if (!geoForm.state.trim()) {
      setGeoError('State is required')
      return
    }
    setGeoSaving(true)
    try {
      await addGeoUpdate(id, {
        state: geoForm.state.trim(),
        district: geoForm.district.trim() || undefined,
        note: geoForm.note || undefined,
      }, 'ngo')
      setGeoForm({ state: '', district: '', note: '' })
      await refreshProject()
      showToast('Geo update saved')
    } catch (err) {
      setGeoError(err.message || 'Failed to save geo update')
    } finally {
      setGeoSaving(false)
    }
  }

  const updateMedia = updates.flatMap((u) => (u.images || []).map((img) => ({
    ...img,
    projectName: project.name,
  })))

  return (
    <>
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-3 text-sm shadow-lg">{toast}</div>
      )}
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
            <div><dt className="text-slate-500">Beneficiaries</dt><dd className="font-medium">{ben.direct?.toLocaleString()} direct · {ben.indirect?.toLocaleString()} indirect</dd></div>
          </dl>
        </Card>
        <Card>
          <h3 className="font-semibold mb-3">Location</h3>
          <p className="text-lg font-medium">{project.location || '—'}</p>
          <p className="text-sm text-slate-500 mt-1">{project.theme || ''}</p>
          {geoUpdates[0] && (
            <p className="text-xs text-slate-500 mt-2">
              Latest: {geoUpdates[0].district ? `${geoUpdates[0].district}, ` : ''}{geoUpdates[0].state}
            </p>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Log Beneficiaries</h3>
          {benError && <Alert variant="error" className="mb-3">{benError}</Alert>}
          <form onSubmit={handleLogBeneficiaries} className="space-y-3">
            <FormField label="Direct">
              <Input type="number" min="0" value={benForm.directCount} onChange={(e) => setBenForm((f) => ({ ...f, directCount: e.target.value }))} required />
            </FormField>
            <FormField label="Indirect">
              <Input type="number" min="0" value={benForm.indirectCount} onChange={(e) => setBenForm((f) => ({ ...f, indirectCount: e.target.value }))} />
            </FormField>
            <FormField label="Note">
              <Input value={benForm.note} onChange={(e) => setBenForm((f) => ({ ...f, note: e.target.value }))} />
            </FormField>
            <Button type="submit" size="sm" disabled={benSaving}>{benSaving ? 'Saving…' : 'Log'}</Button>
          </form>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Add KPI Metric</h3>
          {kpiError && <Alert variant="error" className="mb-3">{kpiError}</Alert>}
          <form onSubmit={handleAddKpi} className="space-y-3">
            <FormField label="Metric Key">
              <Input placeholder="e.g. co2_offset_tons" value={kpiForm.metricKey} onChange={(e) => setKpiForm((f) => ({ ...f, metricKey: e.target.value }))} required />
            </FormField>
            <FormField label="Label">
              <Input value={kpiForm.label} onChange={(e) => setKpiForm((f) => ({ ...f, label: e.target.value }))} required />
            </FormField>
            <FormField label="Value">
              <Input value={kpiForm.value} onChange={(e) => setKpiForm((f) => ({ ...f, value: e.target.value }))} required />
            </FormField>
            <FormField label="Unit">
              <Input placeholder="optional" value={kpiForm.unit} onChange={(e) => setKpiForm((f) => ({ ...f, unit: e.target.value }))} />
            </FormField>
            <Button type="submit" size="sm" disabled={kpiSaving}>{kpiSaving ? 'Saving…' : 'Add KPI'}</Button>
          </form>
          {kpis.length > 0 && (
            <ul className="mt-4 space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-3">
              {kpis.slice(0, 3).map((k) => (
                <li key={k.id}>{k.label}: {k.value}{k.unit ? ` ${k.unit}` : ''}</li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Geo Update</h3>
          {geoError && <Alert variant="error" className="mb-3">{geoError}</Alert>}
          <form onSubmit={handleGeoUpdate} className="space-y-3">
            <FormField label="State">
              <Input value={geoForm.state} onChange={(e) => setGeoForm((f) => ({ ...f, state: e.target.value }))} required />
            </FormField>
            <FormField label="District">
              <Input value={geoForm.district} onChange={(e) => setGeoForm((f) => ({ ...f, district: e.target.value }))} />
            </FormField>
            <FormField label="Note">
              <Input value={geoForm.note} onChange={(e) => setGeoForm((f) => ({ ...f, note: e.target.value }))} />
            </FormField>
            <Button type="submit" size="sm" disabled={geoSaving}>{geoSaving ? 'Saving…' : 'Save'}</Button>
          </form>
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
        <form onSubmit={handlePostUpdate} className="space-y-3">
          <Input placeholder="Share progress with your corporate partner…" value={updateText} onChange={(e) => setUpdateText(e.target.value)} />
          <FileUploadZone
            category="project_update"
            entityType="project"
            entityId={id}
            label="Attach photos to this update"
            hint="PNG or JPG — upload before posting"
            accept={['image/png', 'image/jpeg', 'image/webp']}
            onUploaded={(file) => {
              if (file?.id) setUpdateFileIds((ids) => [...ids, file.id])
            }}
          />
          {updateFileIds.length > 0 && (
            <p className="text-xs text-slate-500">{updateFileIds.length} file(s) ready to attach</p>
          )}
          <Button type="submit" disabled={posting}>{posting ? 'Posting…' : 'Post Update'}</Button>
        </form>
        {updates.length > 0 && (
          <ul className="mt-4 space-y-4 text-sm border-t border-slate-100 pt-4">
            {updates.map((u) => (
              <li key={u.id || u.date}>
                <p><span className="text-slate-500">{u.date}</span> — {u.text || u.body}</p>
                {(u.images?.length > 0) && (
                  <div className="mt-2">
                    <MediaGallery items={u.images} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="font-semibold mb-3">Upload Evidence</h3>
          <FileUploadZone
            category="project_evidence"
            entityType="project"
            entityId={id}
            label="Photos, reports, receipts"
            onUploaded={() => refreshProject()}
          />
          {evidence.length > 0 && (
            <div className="mt-4">
              <MediaGallery items={evidence} />
            </div>
          )}
        </Card>
        <Card>
          <h3 className="font-semibold mb-3">Update Media</h3>
          {updateMedia.length > 0 ? (
            <MediaGallery items={updateMedia} />
          ) : (
            <p className="text-sm text-slate-500">Attach photos when posting updates.</p>
          )}
        </Card>
      </div>

      <div className="mt-6"><Button as={Link} to={NGO_ROUTES.projects} variant="ghost">← Back to Projects</Button></div>
    </>
  )
}
