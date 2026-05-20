import { Calendar, Download } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { StatCard } from '../../components/corporate/StatCard'
import { DataTable } from '../../components/corporate/DataTable'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { volunteerData } from '../../data/corporate/volunteers'

export default function VolunteerManagement() {
  const { summary, campaigns, signups, events } = volunteerData

  const signupColumns = [
    { key: 'name', label: 'Employee', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'campaign', label: 'Campaign', sortable: true },
    { key: 'hours', label: 'Hours', sortable: true },
    { key: 'status', label: 'Status', render: (row) => (
      <Badge variant={row.status === 'confirmed' ? 'verified' : 'warning'}>{row.status}</Badge>
    )},
  ]

  return (
    <>
      <PageHeader
        title="Volunteer Management"
        description="Employee volunteer campaigns, hours tracking, and certificates."
        actions={<Button><Calendar className="h-4 w-4" /> New Campaign</Button>}
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Campaigns" value={summary.campaigns} />
        <StatCard label="Volunteers" value={summary.volunteers} />
        <StatCard label="Hours Logged" value={summary.hoursLogged.toLocaleString()} />
        <StatCard label="Upcoming Events" value={summary.eventsUpcoming} />
      </div>

      <h3 className="font-semibold text-slate-900 mb-4">Volunteer Campaigns</h3>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {campaigns.map((c) => (
          <Card key={c.id}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-slate-900">{c.title}</h4>
              <Badge variant={c.status === 'full' ? 'warning' : 'verified'}>{c.status}</Badge>
            </div>
            <p className="text-sm text-slate-500">{c.date} · {c.location}</p>
            <p className="text-sm mt-2">{c.enrolled}/{c.slots} enrolled</p>
            <Button variant="secondary" size="sm" className="mt-3 w-full" disabled={c.status === 'full'}>
              {c.status === 'full' ? 'Full' : 'Sign Up'}
            </Button>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Employee Signups</h3>
        <DataTable columns={signupColumns} data={signups} keyField="name" />
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
          <h3 className="font-semibold text-slate-900 mb-4">Certificates</h3>
          <p className="text-sm text-slate-600 mb-4">Download volunteer certificates for completed campaigns.</p>
          <Button variant="secondary" onClick={() => alert('Certificate download — demo mode')}>
            <Download className="h-4 w-4" /> Download Sample Certificate
          </Button>
        </Card>
      </div>
    </>
  )
}
