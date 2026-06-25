import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QrCode, CheckCircle, Download } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { DataTable } from '../../components/corporate/DataTable'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { CORPORATE_ROUTES } from '../../lib/routes'
import {
  fetchVolunteerEvent,
  fetchVolunteerSignups,
  fetchEventQr,
  updateVolunteerEvent,
  recordManualAttendance,
  issueVolunteerCertificate,
} from '../../lib/volunteers'
import NotFound from '../public/NotFound'

export default function VolunteerEventDetail() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [signups, setSignups] = useState([])
  const [qr, setQr] = useState(null)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState([])
  const [loadedId, setLoadedId] = useState(null)

  const reload = useCallback(() => {
    return Promise.all([fetchVolunteerEvent(id), fetchVolunteerSignups(id)])
      .then(([ev, su]) => {
        setEvent(ev)
        setSignups(su)
        setLoadedId(id)
        setError(null)
      })
      .catch((err) => setError(err.message || 'Failed to load event'))
  }, [id])

  useEffect(() => {
    reload()
  }, [reload])

  async function loadQr() {
    try {
      const data = await fetchEventQr(id)
      setQr(data)
    } catch (err) {
      setError(err.message || 'Failed to load QR')
    }
  }

  async function completeEvent() {
    try {
      await updateVolunteerEvent(id, { status: 'completed' })
      await reload()
    } catch (err) {
      setError(err.message || 'Failed to update event')
    }
  }

  async function markAttendance() {
    if (!selected.length) return
    try {
      await recordManualAttendance(id, selected)
      setSelected([])
      await reload()
    } catch (err) {
      setError(err.message || 'Failed to record attendance')
    }
  }

  async function issueCert(signupId) {
    try {
      const cert = await issueVolunteerCertificate(signupId)
      if (cert.downloadUrl) window.open(cert.downloadUrl, '_blank')
      await reload()
    } catch (err) {
      setError(err.message || 'Certificate failed')
    }
  }

  if (loadedId !== id && !error) return <p className="text-sm text-slate-500 p-6">Loading event…</p>
  if (error && !event) return <NotFound />
  if (!event) return <NotFound />

  const columns = [
    { key: 'name', label: 'Employee' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <Badge variant={r.status === 'attended' ? 'verified' : 'default'}>{r.status}</Badge>,
    },
    { key: 'checkedIn', label: 'Checked in', render: (r) => (r.checkedIn ? 'Yes' : 'No') },
    {
      key: 'select',
      label: '',
      render: (r) =>
        r.status === 'registered' && (
          <input
            type="checkbox"
            checked={selected.includes(r.id)}
            onChange={(e) => {
              setSelected((prev) => (e.target.checked ? [...prev, r.id] : prev.filter((x) => x !== r.id)))
            }}
          />
        ),
    },
    {
      key: 'cert',
      label: '',
      render: (r) =>
        r.status === 'attended' && (
          <Button size="sm" variant="secondary" onClick={() => issueCert(r.id)}>
            <Download className="h-3 w-3" /> {r.certificateId ? 'Cert' : 'Issue cert'}
          </Button>
        ),
    },
  ]

  return (
    <>
      <PageHeader
        title={event.title}
        description={`${event.location} · ${event.startsAt?.slice?.(0, 16)} · ${event.enrolled}/${event.slots} enrolled`}
        actions={
          <div className="flex gap-2">
            <Button as={Link} to={CORPORATE_ROUTES.volunteers} variant="secondary">
              Back
            </Button>
            {event.status !== 'completed' && (
              <Button variant="secondary" onClick={completeEvent}>
                <CheckCircle className="h-4 w-4" /> Mark completed
              </Button>
            )}
          </div>
        }
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <QrCode className="h-4 w-4" /> QR Check-in
          </h3>
          {!qr ? (
            <Button onClick={loadQr}>Generate QR Code</Button>
          ) : (
            <div className="text-center">
              <img src={qr.qrDataUrl} alt="Check-in QR" className="mx-auto mb-3 rounded-lg border" />
              <p className="text-xs text-slate-500 break-all">{qr.checkInUrl}</p>
              <p className="text-xs text-slate-400 mt-1">Expires {qr.expiresAt?.slice?.(0, 16)}</p>
            </div>
          )}
        </Card>
        <Card>
          <h3 className="font-semibold text-slate-900 mb-3">Event details</h3>
          <dl className="text-sm space-y-2">
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd>
                <Badge>{event.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Hours credit</dt>
              <dd>{event.hoursCredit}h per volunteer</dd>
            </div>
            {event.description && (
              <div>
                <dt className="text-slate-500">Description</dt>
                <dd>{event.description}</dd>
              </div>
            )}
          </dl>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-900">Registrations & Attendance</h3>
          {selected.length > 0 && (
            <Button size="sm" onClick={markAttendance}>
              Mark {selected.length} attended
            </Button>
          )}
        </div>
        <DataTable columns={columns} data={signups} keyField="id" />
      </Card>
    </>
  )
}
