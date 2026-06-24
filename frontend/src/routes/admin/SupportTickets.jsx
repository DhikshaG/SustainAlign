import { useState } from 'react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { supportTickets } from '../../data/admin/support'

const priorityVariant = { high: 'warning', medium: 'primary', low: 'default' }
const statusVariant = { open: 'warning', in_progress: 'primary', resolved: 'verified' }

export default function SupportTickets() {
  const [selected, setSelected] = useState(supportTickets[0])

  return (
    <>
      <PageHeader title="Support Tickets" description="Customer support queue and ticket management." />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <ul className="space-y-1">
            {supportTickets.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelected(t)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 text-sm ${selected?.id === t.id ? 'bg-primary-50' : 'hover:bg-slate-50'}`}
                >
                  <p className="font-medium truncate">{t.subject}</p>
                  <p className="text-xs text-slate-500">{t.id} · {t.created}</p>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        {selected && (
          <Card className="lg:col-span-2">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant={priorityVariant[selected.priority]}>{selected.priority}</Badge>
              <Badge variant={statusVariant[selected.status]}>{selected.status.replace('_', ' ')}</Badge>
            </div>
            <h3 className="font-semibold text-lg text-slate-900 mb-2">{selected.subject}</h3>
            <p className="text-sm text-slate-500 mb-4">{selected.user} · {selected.created}</p>
            <p className="text-sm text-slate-600">Ticket detail view — demo mode. Full conversation thread in Phase 2.</p>
          </Card>
        )}
      </div>
    </>
  )
}
