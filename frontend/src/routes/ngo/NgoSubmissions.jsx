import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/corporate/PageHeader'
import { Card } from '../../components/ui/Card'
import { Alert } from '../../components/ui/Alert'
import { WorkflowStatusBadge } from '../../components/workflow/WorkflowStatusBadge'
import { fetchNgoSubmissions } from '../../lib/crm'
import { NGO_ROUTES } from '../../lib/routes'

const ENTITY_LABELS = {
  project: 'Project approval',
  milestone: 'Milestone review',
  report: 'Report submission',
}

export default function NgoSubmissions() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    fetchNgoSubmissions()
      .then((data) => { if (active) { setItems(data); setError(null) } })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Failed to load submissions')
          setItems([])
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <>
      <PageHeader
        title="Submissions"
        description="Track workflow status for reports and milestone reviews you have submitted."
      />

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading submissions…</p>
      ) : items.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">No workflow submissions yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const label = ENTITY_LABELS[item.entityType] || item.entityType
            const href = item.projectId ? NGO_ROUTES.projectDetail(item.projectId) : null
            return (
              <Card key={item.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {label}
                      {item.entityTitle && `: ${item.entityTitle}`}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Step {item.currentStepIndex + 1} of {item.definition?.steps?.length || '?'}
                    </p>
                    {href && (
                      <Link to={href} className="text-xs text-primary-600 hover:underline mt-1 inline-block">
                        View project →
                      </Link>
                    )}
                  </div>
                  <WorkflowStatusBadge status={item.status} />
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
