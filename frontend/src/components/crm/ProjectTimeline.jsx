import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

const TYPE_LABELS = {
  activity: 'Activity',
  workflow: 'Workflow',
  message: 'Message',
  task: 'Task',
}

export function ProjectTimeline({ items, loading }) {
  if (loading) {
    return <Card><p className="text-sm text-slate-500">Loading timeline…</p></Card>
  }

  return (
    <Card>
      <h3 className="font-semibold text-slate-900 mb-4">Project Timeline</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No CRM activity recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={`${item.type}-${item.id}`} className="flex gap-3 text-sm border-l-2 border-primary-200 pl-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default">{TYPE_LABELS[item.type] || item.type}</Badge>
                  {item.createdAt && (
                    <span className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-slate-700 mt-1">{item.summary}</p>
                {item.reason && <p className="text-xs text-slate-500 mt-0.5">{item.reason}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
