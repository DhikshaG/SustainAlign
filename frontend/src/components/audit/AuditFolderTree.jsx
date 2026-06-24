import { useState } from 'react'
import { ChevronDown, ChevronRight, Folder } from 'lucide-react'
import { Badge } from '../ui/Badge'

function CategoryNode({ category }) {
  return (
    <div className="ml-6 mt-1">
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <Folder className="h-3.5 w-3.5 text-slate-400" />
        <span>{category.name}</span>
        <Badge variant="default">{category.fileCount}</Badge>
      </div>
      <ul className="ml-6 mt-1 space-y-1">
        {category.files?.map((f) => (
          <li key={f.id} className="text-xs text-slate-500 truncate">
            {f.originalName}
            {f.version > 1 && ` (v${f.version})`}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProjectNode({ project }) {
  const [open, setOpen] = useState(true)
  const count = project.categories?.reduce((n, c) => n + (c.fileCount || 0), 0) || 0
  return (
    <div className="ml-4 mt-2">
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1 text-sm font-medium text-slate-800">
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {project.name}
        <Badge variant="primary">{count}</Badge>
      </button>
      {open && project.categories?.map((c) => <CategoryNode key={c.name} category={c} />)}
    </div>
  )
}

export function AuditFolderTree({ folders, loading }) {
  if (loading) return <p className="text-sm text-slate-500">Loading folders…</p>
  if (!folders?.length) return <p className="text-sm text-slate-500">No documents organized yet.</p>

  return (
    <div className="space-y-3">
      {folders.map((fy) => (
        <div key={fy.fiscalYear}>
          <p className="text-sm font-semibold text-slate-900">{fy.fiscalYear}</p>
          {fy.projects?.map((p) => <ProjectNode key={p.name} project={p} />)}
        </div>
      ))}
    </div>
  )
}
