import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { MessageThreadList } from '../../components/crm/MessageThreadList'
import { MessageThreadView } from '../../components/crm/MessageThreadView'
import { fetchThreads, fetchThread, postMessage } from '../../lib/messaging'
import { CORPORATE_ROUTES } from '../../lib/routes'

export default function CommunicationCenter() {
  const [threads, setThreads] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [thread, setThread] = useState(null)
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    fetchThreads('corporate')
      .then((list) => {
        if (!active) return
        setThreads(list)
        if (list.length) setActiveId((prev) => prev || list[0].id)
        setError(null)
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Failed to load threads')
          setThreads([])
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!activeId) return
    let active = true
    fetchThread(activeId, 'corporate')
      .then((data) => { if (active) setThread(data) })
      .catch(() => { if (active) setThread(null) })
      .finally(() => { if (active) setThreadLoading(false) })
    return () => { active = false }
  }, [activeId])

  function selectThread(id) {
    setActiveId(id)
    setThreadLoading(true)
    setThread(null)
  }

  async function refreshThreads() {
    const list = await fetchThreads('corporate')
    setThreads(list)
  }

  async function handleSend(body) {
    setSending(true)
    try {
      await postMessage(activeId, body, 'corporate')
      const updated = await fetchThread(activeId, 'corporate')
      setThread(updated)
      await refreshThreads()
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Communication Center"
        description="Message threads with NGO partners on active projects."
      />

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {loading ? (
          <Card className="lg:col-span-3"><p className="text-sm text-slate-500">Loading threads…</p></Card>
        ) : (
          <>
            <MessageThreadList
              threads={threads}
              activeId={activeId}
              onSelect={selectThread}
              counterpartyKey="ngoName"
            />
            <MessageThreadView
              thread={thread}
              loading={threadLoading}
              onSend={handleSend}
              sending={sending}
            />
          </>
        )}
      </div>

      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> Approval Workflows
        </h3>
        <p className="text-sm text-slate-600 mb-3">
          Project approvals, milestone reviews, and other workflow items are managed in the Approvals inbox.
        </p>
        <Button as={Link} to={CORPORATE_ROUTES.approvals} size="sm" variant="secondary">
          Open Approvals Inbox
        </Button>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-2">Email Integration</h3>
        <p className="text-sm text-slate-600">Connect your corporate email to sync NGO communications and approval notifications.</p>
        <Button variant="secondary" size="sm" className="mt-3">Configure Email — Coming Soon</Button>
      </Card>
    </>
  )
}
