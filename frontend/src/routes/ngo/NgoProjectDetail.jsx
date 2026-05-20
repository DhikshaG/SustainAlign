import { Link, useParams } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { getNgoProject } from '../../data/ngo/projects'
import { NGO_ROUTES } from '../../lib/routes'
import { formatINR } from '../../data/ngo/dashboard'
import NotFound from '../public/NotFound'

export default function NgoProjectDetail() {
  const { id } = useParams()
  const project = getNgoProject(id)
  if (!project) return <NotFound />

  return (
    <>
      <PageHeader
        title={project.name}
        breadcrumbs={[{ label: 'Projects', href: NGO_ROUTES.projects }, { label: project.name }]}
        actions={<Badge variant="verified">{project.status}</Badge>}
      />
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">Corporate Partner</dt><dd className="font-medium">{project.partner}</dd></div>
            <div><dt className="text-slate-500">Budget</dt><dd className="font-medium">{formatINR(project.budget)}</dd></div>
            <div><dt className="text-slate-500">Spent</dt><dd className="font-medium">{formatINR(project.spent)}</dd></div>
            <div><dt className="text-slate-500">Progress</dt><dd><ProgressBar value={project.progress} /></dd></div>
          </dl>
        </Card>
        <Card>
          <h3 className="font-semibold mb-3">Beneficiaries</h3>
          <p className="text-2xl font-bold">{project.beneficiaries.direct.toLocaleString()}</p>
          <p className="text-sm text-slate-500">+{project.beneficiaries.added} added this quarter</p>
        </Card>
      </div>
      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Milestones</h3>
        <div className="space-y-4">
          {project.milestones.map((m) => (
            <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-slate-100 pb-4 last:border-0">
              <div className="flex-1">
                <p className="font-medium text-sm">{m.title}</p>
                <p className="text-xs text-slate-500">Due: {m.due}</p>
              </div>
              <Select defaultValue={m.status} className="w-40" onChange={() => {}}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </Select>
              <Badge variant={m.status === 'completed' ? 'verified' : 'default'}>{m.status.replace('_', ' ')}</Badge>
            </div>
          ))}
        </div>
        <Button size="sm" className="mt-4" onClick={() => alert('Milestone updated — demo mode')}>Save Milestone Updates</Button>
      </Card>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Upload className="h-4 w-4" /> Upload Evidence</h3>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-500 mb-2">Photos, reports, receipts</p>
            <Button variant="secondary" size="sm">Choose Files</Button>
          </div>
          {project.evidence.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm">{project.evidence.map((e) => <li key={e.id}>{e.name} · {e.date}</li>)}</ul>
          )}
        </Card>
        <Card>
          <h3 className="font-semibold mb-3">Expenses</h3>
          <ul className="space-y-2 text-sm mb-4">
            {project.expenses.map((ex) => (
              <li key={ex.id} className="flex justify-between"><span>{ex.description}</span><span>{formatINR(ex.amount)} <Badge variant={ex.status === 'approved' ? 'verified' : 'warning'}>{ex.status}</Badge></span></li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input placeholder="Amount" type="number" className="flex-1" />
            <Button size="sm" onClick={() => alert('Expense uploaded — demo mode')}>Add</Button>
          </div>
        </Card>
      </div>
      <div className="mt-6"><Button as={Link} to={NGO_ROUTES.projects} variant="ghost">← Back to Projects</Button></div>
    </>
  )
}
