import { useState } from 'react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { verificationQueue } from '../../data/admin/verification'

export default function NgoVerification() {
  const [toast, setToast] = useState(null)

  function act(action, name) {
    setToast(`${action}: ${name} — demo mode`)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <>
      <PageHeader title="NGO Verification Queue" description="Review and approve NGO registration documents." />
      {toast && <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-3 text-sm shadow-lg">{toast}</div>}
      <div className="space-y-4">
        {verificationQueue.map((item) => (
          <Card key={item.id}>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">{item.ngoName}</h3>
                  <Badge variant={item.status === 'review' ? 'primary' : 'warning'}>{item.status}</Badge>
                </div>
                <p className="text-sm text-slate-500">{item.email} · Submitted {item.submitted}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {Object.entries(item.docs).map(([key, ok]) => (
                    <Badge key={key} variant={ok ? 'verified' : 'default'}>{key}: {ok ? '✓' : '✗'}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => act('Approved', item.ngoName)}>Approve</Button>
                <Button size="sm" variant="secondary" onClick={() => act('Rejected', item.ngoName)}>Reject</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
