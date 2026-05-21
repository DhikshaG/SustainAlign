import { useState, useEffect } from 'react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { fetchVerificationQueue, approveNgo, rejectNgo } from '../../lib/ngo'

export default function NgoVerification() {
  const [queue, setQueue] = useState([])
  const [syncKey, setSyncKey] = useState(0)
  const [readyKey, setReadyKey] = useState(-1)
  const [toast, setToast] = useState(null)
  const loading = readyKey !== syncKey

  useEffect(() => {
    let active = true
    fetchVerificationQueue()
      .then((data) => { if (active) setQueue(Array.isArray(data) ? data : []) })
      .catch(() => { if (active) setQueue([]) })
      .finally(() => { if (active) setReadyKey(syncKey) })
    return () => { active = false }
  }, [syncKey])

  function loadQueue() {
    setSyncKey((k) => k + 1)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleApprove(tenantId, name) {
    try {
      await approveNgo(tenantId)
      showToast(`Approved: ${name}`)
      loadQueue()
    } catch (err) {
      showToast(err.message || 'Approve failed')
    }
  }

  async function handleReject(tenantId, name) {
    try {
      await rejectNgo(tenantId, 'Documents incomplete')
      showToast(`Rejected: ${name}`)
      loadQueue()
    } catch (err) {
      showToast(err.message || 'Reject failed')
    }
  }

  return (
    <>
      <PageHeader title="NGO Verification Queue" description="Review and approve NGO registration documents." />
      {toast && <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-3 text-sm shadow-lg">{toast}</div>}
      {loading ? (
        <p className="text-slate-500">Loading queue...</p>
      ) : queue.length === 0 ? (
        <Card><p className="text-slate-600">No NGOs pending verification.</p></Card>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => (
            <Card key={item.tenantId}>
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    <Badge variant="warning">{item.verificationStatus}</Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    {item.registrationNumber} · {item.contactPerson || 'No contact'} · {item.documentsCount} document(s)
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => handleApprove(item.tenantId, item.name)}>Approve</Button>
                  <Button size="sm" variant="secondary" onClick={() => handleReject(item.tenantId, item.name)}>Reject</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
