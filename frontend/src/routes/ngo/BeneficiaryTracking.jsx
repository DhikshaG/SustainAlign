import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { StatCard } from '../../components/corporate/StatCard'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { FormField } from '../../components/ui/FormField'
import { fetchNgoBeneficiaryLogs, addBeneficiaryLog } from '../../lib/impact'
import { fetchNgoProjects } from '../../lib/projects'

export default function BeneficiaryTracking() {
  const [logs, setLogs] = useState([])
  const [projects, setProjects] = useState([])
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({ projectId: '', directCount: '', indirectCount: '', note: '' })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [logData, projectList] = await Promise.all([
          fetchNgoBeneficiaryLogs(),
          fetchNgoProjects(),
        ])
        if (cancelled) return
        setLogs(logData)
        setProjects(projectList.filter((p) => p.status === 'active'))
        setError(null)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load beneficiaries')
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  async function loadData() {
    const [logData, projectList] = await Promise.all([
      fetchNgoBeneficiaryLogs(),
      fetchNgoProjects(),
    ])
    setLogs(logData)
    setProjects(projectList.filter((p) => p.status === 'active'))
    setError(null)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    const directCount = parseInt(form.directCount, 10)
    const indirectCount = parseInt(form.indirectCount, 10) || 0
    if (!form.projectId) {
      setFormError('Select a project')
      return
    }
    if (Number.isNaN(directCount) || directCount < 0) {
      setFormError('Enter a valid direct count')
      return
    }
    setSubmitting(true)
    try {
      await addBeneficiaryLog(form.projectId, {
        directCount,
        indirectCount,
        note: form.note || undefined,
      }, 'ngo')
      await loadData()
      setShowModal(false)
      setForm({ projectId: '', directCount: '', indirectCount: '', note: '' })
      showToast('Beneficiaries logged')
    } catch (err) {
      setFormError(err.message || 'Failed to log beneficiaries')
    } finally {
      setSubmitting(false)
    }
  }

  const totalDirect = logs.reduce((s, l) => s + (l.direct || 0), 0)
  const totalIndirect = logs.reduce((s, l) => s + (l.indirect || 0), 0)

  return (
    <>
      <PageHeader
        title="Beneficiary Tracking"
        description="Beneficiary counts logged per CSR project."
        actions={
          <Button size="sm" onClick={() => setShowModal(true)}>Log Beneficiaries</Button>
        }
      />
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-3 text-sm shadow-lg">{toast}</div>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Direct Beneficiaries" value={totalDirect.toLocaleString()} />
        <StatCard label="Indirect Beneficiaries" value={totalIndirect.toLocaleString()} />
        <StatCard label="Log Entries" value={logs.length} />
      </div>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Beneficiary Logs</h3>
        {!logs.length && !error && <p className="text-sm text-slate-500">No logs yet.</p>}
        <div className="space-y-2">
          {logs.map((r) => (
            <div key={r.id} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
              <div>
                <p className="font-medium">{r.projectName}</p>
                <p className="text-slate-500">{r.note || '—'} · {r.recordedAt ? new Date(r.recordedAt).toLocaleDateString() : ''}</p>
              </div>
              <span className="font-semibold">{(r.direct + r.indirect).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md">
            <h3 className="font-semibold text-slate-900 mb-4">Log Beneficiaries</h3>
            {formError && <Alert variant="error" className="mb-3">{formError}</Alert>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Project">
                <Select
                  value={form.projectId}
                  onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
                  required
                >
                  <option value="">Select project…</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Direct Count">
                <Input
                  type="number"
                  min="0"
                  value={form.directCount}
                  onChange={(e) => setForm((f) => ({ ...f, directCount: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="Indirect Count">
                <Input
                  type="number"
                  min="0"
                  value={form.indirectCount}
                  onChange={(e) => setForm((f) => ({ ...f, indirectCount: e.target.value }))}
                />
              </FormField>
              <FormField label="Note (optional)">
                <Input
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                />
              </FormField>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Log'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  )
}
