import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { DataTable } from '../../components/corporate/DataTable'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { projects, projectStatuses } from '../../data/corporate/projects'
import { corporateNgos } from '../../data/corporate/ngos'
import { CORPORATE_ROUTES } from '../../lib/routes'
import { formatINR } from '../../data/corporate/dashboard'

export default function ProjectsIndex() {
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [step, setStep] = useState(1)
  const [toast, setToast] = useState(null)

  const columns = [
    { key: 'name', label: 'Project', sortable: true, render: (row) => <span className="font-medium text-slate-900">{row.name}</span> },
    { key: 'ngoName', label: 'NGO', sortable: true },
    { key: 'status', label: 'Status', render: (row) => {
      const s = projectStatuses[row.status] || projectStatuses.active
      return <Badge variant={s.variant}>{s.label}</Badge>
    }},
    { key: 'budget', label: 'Budget', sortable: true, render: (row) => formatINR(row.budget) },
    { key: 'theme', label: 'Theme', sortable: true },
    { key: 'progress', label: 'Progress', render: (row) => <ProgressBar value={row.progress} showValue={false} className="w-24" /> },
  ]

  function handleCreate(e) {
    e.preventDefault()
    setShowCreate(false)
    setStep(1)
    setToast('Project created — demo mode')
    setTimeout(() => setToast(null), 3000)
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

      <DataTable
        columns={columns}
        data={projects}
        keyField="id"
        onRowClick={(row) => navigate(CORPORATE_ROUTES.projectDetail(row.id))}
      />

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <Card className="w-full max-w-lg">
            <h3 className="font-semibold text-slate-900 mb-1">Create Project — Step {step} of 3</h3>
            <p className="text-sm text-slate-500 mb-4">
              {step === 1 && 'Basic project details'}
              {step === 2 && 'Assign NGO and budget'}
              {step === 3 && 'Review and submit'}
            </p>
            <form onSubmit={step < 3 ? (e) => { e.preventDefault(); setStep(step + 1) } : handleCreate} className="space-y-3">
              {step === 1 && (
                <>
                  <Input placeholder="Project name" required />
                  <Select required defaultValue="">
                    <option value="" disabled>Schedule VII category</option>
                    <option>Promoting education</option>
                    <option>Promoting health care</option>
                    <option>Ensuring environmental sustainability</option>
                  </Select>
                  <Input type="date" required />
                </>
              )}
              {step === 2 && (
                <>
                  <Select required defaultValue="">
                    <option value="" disabled>Select NGO</option>
                    {corporateNgos.map((n) => <option key={n.slug} value={n.slug}>{n.name}</option>)}
                  </Select>
                  <Input placeholder="Budget (INR)" type="number" required />
                  <Input placeholder="Location / district" required />
                </>
              )}
              {step === 3 && (
                <p className="text-sm text-slate-600 py-4">Review your project details and submit for approval workflow.</p>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); setStep(1) }}>Cancel</Button>
                {step > 1 && <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
                <Button type="submit">{step < 3 ? 'Next' : 'Create Project'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  )
}
