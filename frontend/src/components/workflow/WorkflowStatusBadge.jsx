import { Badge } from '../ui/Badge'

const VARIANTS = {
  pending: 'warning',
  approved: 'verified',
  rejected: 'default',
  needs_revision: 'primary',
}

export function WorkflowStatusBadge({ status }) {
  const label = status?.replace('_', ' ') || 'unknown'
  return <Badge variant={VARIANTS[status] || 'default'}>{label}</Badge>
}
