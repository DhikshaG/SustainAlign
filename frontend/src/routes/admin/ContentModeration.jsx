import { useState } from 'react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { contentModeration } from '../../data/admin/content'

export default function ContentModeration() {
  const [toast, setToast] = useState(null)

  function act(action, title) {
    setToast(`${action}: ${title} — demo mode`)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <>
      <PageHeader title="Content Moderation" description="Review flagged public content, NGO profiles, and blog posts." />
      {toast && <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-3 text-sm shadow-lg">{toast}</div>}
      <div className="space-y-4">
        {contentModeration.map((item) => (
          <Card key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default">{item.type}</Badge>
                <Badge variant={item.status === 'pending' ? 'warning' : 'primary'}>{item.status}</Badge>
              </div>
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="text-sm text-slate-500">{item.reason} · {item.flagged}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={() => act('Approved', item.title)}>Approve</Button>
              <Button size="sm" variant="secondary" onClick={() => act('Removed', item.title)}>Remove</Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
