import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'
import { WorkflowStatusBadge } from './WorkflowStatusBadge'
import { fetchWorkflowInbox, transitionWorkflow } from '../../lib/workflow'
import { CORPORATE_ROUTES } from '../../lib/routes'

const ENTITY_LABELS = {
  project: 'Project approval',
  milestone: 'Milestone review',
  report: 'Report submission',
  workflow: 'Workflow',
}

function entityLink(item) {
  if (item.entityType === 'milestone' && item.projectId) {
    return CORPORATE_ROUTES.projectDetail(item.projectId)
  }
  if (item.entityType === 'project') {
    return CORPORATE_ROUTES.projectDetail(item.entityId)
  }
  return null
}

export function ApprovalInbox({ onUpdate }) {
  const [items, setItems] = useState([])
  const [comment, setComment] = useState({})
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetchWorkflowInbox()
      setItems(res.data?.items || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetchWorkflowInbox()
        if (active) setItems(res.data?.items || [])
      } catch {
        if (active) setItems([])
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  async function act(id, action) {
    await transitionWorkflow(id, action, comment[id] || '')
    await load()
    onUpdate?.()
  }

  if (loading) return <p className="text-sm text-slate-500">Loading approvals…</p>
  if (!items.length) return <p className="text-sm text-slate-500">No pending approvals</p>

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const label = ENTITY_LABELS[item.entityType] || item.entityType
        const href = entityLink(item)
        return (
          <Card key={item.id} padding>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="font-medium text-slate-900">
                  {label}
                  {item.entityTitle && `: ${item.entityTitle}`}
                </p>
                <p className="text-xs text-slate-500">
                  Step {item.currentStepIndex + 1} of {item.definition?.steps?.length || '?'}
                  {item.entityType === 'milestone' && item.projectId && (
                    <> · Project {item.projectId.slice(0, 8)}</>
                  )}
                </p>
                {href && (
                  <Link to={href} className="text-xs text-primary-600 hover:underline mt-1 inline-block">
                    View project →
                  </Link>
                )}
                <Link to={CORPORATE_ROUTES.auditTrail} className="text-xs text-slate-500 hover:underline mt-1 block">
                  View in audit trail →
                </Link>
              </div>
              <WorkflowStatusBadge status={item.status} />
            </div>
            {item.status === 'pending' && (
              <>
                <Textarea
                  placeholder="Comment (optional)"
                  value={comment[item.id] || ''}
                  onChange={(e) => setComment((c) => ({ ...c, [item.id]: e.target.value }))}
                  className="mb-3"
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => act(item.id, 'approve')}>Approve</Button>
                  <Button size="sm" variant="secondary" onClick={() => act(item.id, 'request_revision')}>Needs revision</Button>
                  <Button size="sm" variant="ghost" onClick={() => act(item.id, 'reject')}>Reject</Button>
                </div>
              </>
            )}
          </Card>
        )
      })}
    </div>
  )
}
