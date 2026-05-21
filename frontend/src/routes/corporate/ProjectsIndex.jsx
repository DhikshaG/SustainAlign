import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { DataTable } from '../../components/corporate/DataTable'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { projectStatuses } from '../../data/corporate/projects'
import { CORPORATE_ROUTES } from '../../lib/routes'
import { formatINR } from '../../data/corporate/dashboard'
import { fetchDiscoveryNgos } from '../../lib/discovery'
import {
  createProject,
  fetchProjects,
  SCHEDULE_VII_OPTIONS,
  THEME_FROM_SCHEDULE,
} from '../../lib/projects'
import { createProjectSchema } from '../../lib/validation/schemas'

const EMPTY_FORM = {
  name: '',
  scheduleVii: '',
  startDate: '',
  endDate: '',
  ngoSlug: '',
  budgetInr: '',
  location: '',
  description: '',
}

export default function ProjectsIndex() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [ngos, setNgos] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setProjects(await fetchProjects())
    } catch (err) {
      setError(err.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setShowCreate(true)
      const slug = searchParams.get('ngoSlug')
      if (slug) setForm((f) => ({ ...f, ngoSlug: slug }))
    }
  }, [searchParams])

  useEffect(() => {
    if (!showCreate) return
    fetchDiscoveryNgos({ verified: 'true', limit: 100 })
      .then((r) => setNgos(r.ngos))
      .catch(() => setNgos([]))
  }, [showCreate])

  const columns = [
    { key: 'name', label: 'Project', sortable: true, render: (row) => <span className="font-medium text-slate-900">{row.name}</span> },
    { key: 'ngoName', label: 'NGO', sortable: true },
    { key: 'status', label: 'Status', render: (row) => {
      const s = projectStatuses[row.status] || projectStatuses.active
      return <Badge variant={s.variant}>{s.label}</Badge>
    }},
    { key: 'budget', label: 'Budget', sortable: true, render: (row) => formatINR(row.budget ?? row.budgetInr) },
    { key: 'theme', label: 'Theme', sortable: true },
    { key: 'progress', label: 'Progress', render: (row) => <ProgressBar value={row.progress ?? 0} showValue={false} className="w-24" /> },
  ]

  function closeCreate() {
    setShowCreate(false)
    setStep(1)
    setForm(EMPTY_FORM)
    setFormError(null)
    if (searchParams.get('create')) {
      const next = new URLSearchParams(searchParams)
      next.delete('create')
      next.delete('ngoSlug')
      setSearchParams(next, { replace: true })
    }
  }

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setFormError(null)
    const parsed = createProjectSchema.safeParse({
      ...form,
      budgetInr: Number(form.budgetInr),
      theme: form.theme || THEME_FROM_SCHEDULE[form.scheduleVii] || undefined,
    })
    if (!parsed.success) {
      setFormError(parsed.error.errors[0]?.message || 'Invalid form')
      return
    }
    setSubmitting(true)
    try {
      const project = await createProject(parsed.data)
      closeCreate()
      setToast(`Project created — pending approval (${project.id})`)
      setTimeout(() => setToast(null), 4000)
      await load()
      navigate(CORPORATE_ROUTES.projectDetail(project.id))
    } catch (err) {
      setFormError(err.message || 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="CSR Projects"
        description="Create, track, and manage CSR projects with NGOs."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Create Project
          </Button>
        }
      />

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-3 text-sm shadow-lg">{toast}</div>
      )}

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
          <Button variant="ghost" size="sm" className="ml-2" onClick={load}>Retry</Button>
        </Alert>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading projects…</p>
      ) : (
        <DataTable
          columns={columns}
          data={projects}
          keyField="id"
          onRowClick={(row) => navigate(CORPORATE_ROUTES.projectDetail(row.id))}
        />
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-slate-900 mb-1">Create Project — Step {step} of 3</h3>
            <p className="text-sm text-slate-500 mb-4">
              {step === 1 && 'Basic project details'}
              {step === 2 && 'Assign NGO and budget'}
              {step === 3 && 'Review and submit for approval'}
            </p>
            {formError && <Alert variant="error" className="mb-3">{formError}</Alert>}
            <form onSubmit={step < 3 ? (e) => { e.preventDefault(); setStep(step + 1) } : handleCreate} className="space-y-3">
              {step === 1 && (
                <>
                  <Input placeholder="Project name" required value={form.name} onChange={(e) => setField('name', e.target.value)} />
                  <Select required value={form.scheduleVii} onChange={(e) => setField('scheduleVii', e.target.value)}>
                    <option value="" disabled>Schedule VII category</option>
                    {SCHEDULE_VII_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" required value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} />
                    <Input type="date" required value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} />
                  </div>
                  <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setField('description', e.target.value)} />
                </>
              )}
              {step === 2 && (
                <>
                  <Select required value={form.ngoSlug} onChange={(e) => setField('ngoSlug', e.target.value)}>
                    <option value="" disabled>Select verified NGO</option>
                    {ngos.map((n) => <option key={n.slug} value={n.slug}>{n.name}</option>)}
                  </Select>
                  <Input placeholder="Budget (INR)" type="number" required min={1} value={form.budgetInr} onChange={(e) => setField('budgetInr', e.target.value)} />
                  <Input placeholder="Location / district" required value={form.location} onChange={(e) => setField('location', e.target.value)} />
                </>
              )}
              {step === 3 && (
                <dl className="text-sm space-y-2 py-2">
                  <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd className="font-medium">{form.name}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Schedule VII</dt><dd className="font-medium text-right max-w-[60%]">{form.scheduleVii}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Timeline</dt><dd className="font-medium">{form.startDate} → {form.endDate}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">NGO</dt><dd className="font-medium">{ngos.find((n) => n.slug === form.ngoSlug)?.name || form.ngoSlug}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Budget</dt><dd className="font-medium">{formatINR(Number(form.budgetInr))}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Location</dt><dd className="font-medium">{form.location}</dd></div>
                </dl>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="secondary" onClick={closeCreate}>Cancel</Button>
                {step > 1 && <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
                <Button type="submit" disabled={submitting}>{step < 3 ? 'Next' : (submitting ? 'Creating…' : 'Create Project')}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  )
}
