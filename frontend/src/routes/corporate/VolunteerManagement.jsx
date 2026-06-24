import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Download, Users, ExternalLink } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { StatCard } from '../../components/corporate/StatCard'
import { DataTable } from '../../components/corporate/DataTable'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { FormField } from '../../components/ui/FormField'
import { CORPORATE_ROUTES } from '../../lib/routes'
import {
  fetchVolunteerSummary,
  fetchVolunteerEvents,
  fetchVolunteerSignups,
  fetchVolunteerCalendar,
  createVolunteerEvent,
  registerForVolunteerEvent,
  issueVolunteerCertificate,
} from '../../lib/volunteers'

const STATUS_VARIANT = {
  open: 'verified',
  full: 'warning',
  completed: 'default',
  draft: 'default',
  cancelled: 'error',
}

export default function VolunteerManagement() {
  const [summary, setSummary] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [signups, setSignups] = useState([])
  const [events, setEvents] = useState([])
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    startsAt: '',
    endsAt: '',
    slots: 20,
    hoursCredit: 4,
    status: 'open',
  })

  function reload() {
    return Promise.all([
      fetchVolunteerSummary(),
      fetchVolunteerEvents(),
      fetchVolunteerSignups(),
      fetchVolunteerCalendar(),
    ]).then(([s, ev, su, cal]) => {
      setSummary(s)
      setCampaigns(ev)
      setSignups(su)
      setEvents(cal)
      setError(null)
    }).catch((err) => setError(err.message || 'Failed to load volunteers'))
  }

  useEffect(() => {
    reload()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    try {
      await createVolunteerEvent({
        ...form,
        slots: Number(form.slots),
        hoursCredit: Number(form.hoursCredit),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      })
      setShowCreate(false)
      await reload()
    } catch (err) {
      setError(err.message || 'Failed to create event')
    } finally {
      setCreating(false)
    }
  }

  async function handleSignup(eventId) {
    try {
      await registerForVolunteerEvent(eventId)
      await reload()
    } catch (err) {
      setError(err.message || 'Registration failed')
    }
  }

  async function handleCertDownload(signupId) {
    try {
      const cert = await issueVolunteerCertificate(signupId)
      if (cert.downloadUrl) window.open(cert.downloadUrl, '_blank')
    } catch (err) {
      setError(err.message || 'Certificate download failed')
    }
  }

  const signupColumns = [
    { key: 'name', label: 'Employee', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'campaign', label: 'Campaign', sortable: true },
    { key: 'hours', label: 'Hours', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'attended' ? 'verified' : row.status === 'registered' ? 'default' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => row.status === 'attended' && (
        <Button variant="secondary" size="sm" onClick={() => handleCertDownload(row.id)}>
          <Download className="h-3 w-3" /> Cert
        </Button>
      ),
    },
  ]

  if (!summary && !error) return <p className="text-sm text-slate-500 p-6">Loading volunteers…</p>

  return (
    <>
      <PageHeader
        title="Volunteer Management"
        description="Employee volunteer campaigns, hours tracking, and certificates."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Calendar className="h-4 w-4" /> New Campaign
          </Button>
        }
      />

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {summary && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard label="Active Campaigns" value={summary.campaigns} />
          <StatCard label="Volunteers" value={summary.volunteers} />
          <StatCard label="Hours Logged" value={summary.hoursLogged?.toLocaleString?.() ?? summary.hoursLogged} />
          <StatCard label="Upcoming Events" value={summary.eventsUpcoming} />
        </div>
      )}

      <h3 className="font-semibold text-slate-900 mb-4">Volunteer Campaigns</h3>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {campaigns.map((c) => (
          <Card key={c.id}>
            <div className="flex justify-between items-start mb-2">
              <Link to={`${CORPORATE_ROUTES.volunteers}/${c.id}`} className="font-medium text-slate-900 hover:text-primary-600">
                {c.title}
              </Link>
              <Badge variant={STATUS_VARIANT[c.status] || 'default'}>{c.status}</Badge>
            </div>
            <p className="text-sm text-slate-500">
              {c.startsAt?.slice?.(0, 10) ?? c.startsAt} · {c.location}
            </p>
            <p className="text-sm mt-2">{c.enrolled ?? 0}/{c.slots} enrolled · {c.hoursCredit}h credit</p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                disabled={c.status === 'full' || c.status === 'completed'}
                onClick={() => handleSignup(c.id)}
              >
                {c.status === 'full' ? 'Full' : 'Sign Up'}
              </Button>
              <Button as={Link} to={`${CORPORATE_ROUTES.volunteers}/${c.id}`} variant="secondary" size="sm">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}
        {!campaigns.length && <p className="text-sm text-slate-500 col-span-full">No volunteer events yet.</p>}
      </div>

      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Employee Signups</h3>
        <DataTable columns={signupColumns} data={signups} keyField="id" />
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Event Calendar</h3>
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-900">{e.title}</p>
                  <p className="text-slate-500">{e.type}</p>
                </div>
                <span className="text-slate-600">{e.date}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4" /> Quick Check-in
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Open an event to display its QR code. Employees scan the code or use the check-in link.
          </p>
          <Button as={Link} to={CORPORATE_ROUTES.volunteers} variant="secondary">
            Manage events above
          </Button>
        </Card>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg">
            <h3 className="font-semibold text-slate-900 mb-4">New Volunteer Campaign</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <FormField label="Title">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </FormField>
              <FormField label="Location">
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
              </FormField>
              <FormField label="Description">
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Starts">
                  <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required />
                </FormField>
                <FormField label="Ends">
                  <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} required />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Slots">
                  <Input type="number" min={1} value={form.slots} onChange={(e) => setForm({ ...form, slots: e.target.value })} required />
                </FormField>
                <FormField label="Hours credit">
                  <Input type="number" min={0.5} step={0.5} value={form.hoursCredit} onChange={(e) => setForm({ ...form, hoursCredit: e.target.value })} required />
                </FormField>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create & Publish'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  )
}
