import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/corporate/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Textarea } from '../../components/ui/Textarea'
import { formatINR } from '../../data/ngo/dashboard'
import { fetchPartnershipRequests, respondToPartnership } from '../../lib/crm'
import { NGO_ROUTES } from '../../lib/routes'

export default function NgoPartnershipInbox() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notes, setNotes] = useState({})
  const [actingId, setActingId] = useState(null)

  useEffect(() => {
    let active = true
    fetchPartnershipRequests()
      .then((rows) => { if (active) { setRequests(rows); setError(null) } })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Failed to load partnership requests')
          setRequests([])
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function reload() {
    setLoading(true)
    try {
      setRequests(await fetchPartnershipRequests())
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load partnership requests')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  async function respond(projectId, action) {
    setActingId(projectId)
    try {
      await respondToPartnership(projectId, { action, note: notes[projectId] || undefined })
      await reload()
    } catch (err) {
      setError(err.message || 'Failed to respond')
    } finally {
      setActingId(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Partnership Requests"
        description="Review and respond to corporate project invitations."
      />

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading requests…</p>
      ) : requests.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">No pending partnership requests.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{req.name}</h3>
                  <p className="text-sm text-slate-500">{req.corporateName}</p>
                </div>
                <Badge variant="warning">Pending response</Badge>
              </div>
              {req.description && <p className="text-sm text-slate-600 mb-3">{req.description}</p>}
              <dl className="grid sm:grid-cols-2 gap-2 text-sm mb-4">
                <div><dt className="text-slate-500">Budget</dt><dd className="font-medium">{formatINR(req.budgetInr)}</dd></div>
                <div><dt className="text-slate-500">Location</dt><dd className="font-medium">{req.location || '—'}</dd></div>
                <div><dt className="text-slate-500">Theme</dt><dd className="font-medium">{req.theme || '—'}</dd></div>
                <div><dt className="text-slate-500">Timeline</dt><dd className="font-medium">{req.startDate} → {req.endDate}</dd></div>
              </dl>
              <Textarea
                placeholder="Optional note to corporate partner"
                value={notes[req.id] || ''}
                onChange={(e) => setNotes((n) => ({ ...n, [req.id]: e.target.value }))}
                className="mb-3"
                rows={2}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={actingId === req.id}
                  onClick={() => respond(req.id, 'accept')}
                >
                  {actingId === req.id ? 'Saving…' : 'Accept partnership'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={actingId === req.id}
                  onClick={() => respond(req.id, 'decline')}
                >
                  Decline
                </Button>
                <Button as={Link} to={NGO_ROUTES.projectDetail(req.id)} size="sm" variant="ghost">
                  View project
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
