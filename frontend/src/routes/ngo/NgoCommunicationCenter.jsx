import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { Card } from '../../components/ui/Card'
import { Alert } from '../../components/ui/Alert'
import { MessageThreadList } from '../../components/crm/MessageThreadList'
import { MessageThreadView } from '../../components/crm/MessageThreadView'
import { fetchThreads, fetchThread, postMessage } from '../../lib/messaging'

export default function NgoCommunicationCenter() {
  const [threads, setThreads] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [thread, setThread] = useState(null)
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    fetchThreads('ngo')
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
    fetchThread(activeId, 'ngo')
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
    const list = await fetchThreads('ngo')
    setThreads(list)
  }

  async function handleSend(body) {
    setSending(true)
    try {
      await postMessage(activeId, body, 'ngo')
      const updated = await fetchThread(activeId, 'ngo')
      setThread(updated)
      await refreshThreads()
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Communications"
        description="Message threads with corporate partners."
      />

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="grid lg:grid-cols-3 gap-6">
        {loading ? (
          <Card className="lg:col-span-3"><p className="text-sm text-slate-500">Loading threads…</p></Card>
        ) : (
          <>
            <MessageThreadList
              threads={threads}
              activeId={activeId}
              onSelect={selectThread}
              counterpartyKey="corporateName"
              emptyLabel="No message threads yet. Threads appear after a partnership is active."
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
    </>
  )
}
