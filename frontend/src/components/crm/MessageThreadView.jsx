import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Alert'

export function MessageThreadView({ thread, loading, onSend, sending }) {
  const [body, setBody] = useState('')
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!body.trim()) return
    setError(null)
    try {
      await onSend(body.trim())
      setBody('')
    } catch (err) {
      setError(err.message || 'Failed to send message')
    }
  }

  if (loading) {
    return (
      <Card className="lg:col-span-2">
        <p className="text-sm text-slate-500">Loading thread…</p>
      </Card>
    )
  }

  if (!thread) {
    return (
      <Card className="lg:col-span-2">
        <p className="text-sm text-slate-500">Select a thread to view messages.</p>
      </Card>
    )
  }

  const counterparty = thread.ngoName || thread.corporateName

  return (
    <Card className="lg:col-span-2 flex flex-col min-h-[320px]">
      <h4 className="font-semibold text-slate-900">{thread.subject}</h4>
      <p className="text-sm text-slate-500 mb-4">
        {counterparty && `${counterparty} · `}
        {thread.updated ? `Updated ${thread.updated}` : ''}
      </p>

      <div className="flex-1 space-y-3 mb-4 max-h-80 overflow-y-auto">
        {(thread.messages ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">No messages yet.</p>
        ) : (
          (thread.messages ?? []).map((m) => (
            <div key={m.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <p className="text-xs text-slate-500 mb-1">
                {m.senderName || 'User'}
                {m.createdAt && ` · ${new Date(m.createdAt).toLocaleString()}`}
              </p>
              <p className="text-slate-700 whitespace-pre-wrap">{m.body}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-4">
        {error && <Alert variant="error" className="mb-2">{error}</Alert>}
        <textarea
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-2"
          rows={3}
          placeholder="Write a message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <Button type="submit" size="sm" disabled={sending || !body.trim()}>
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </form>
    </Card>
  )
}
