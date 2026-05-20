import { useState } from 'react'
import { Mail, Bell, CheckCircle, MessageCircle } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { communicationsData } from '../../data/corporate/communications'

export default function CommunicationCenter() {
  const [activeThread, setActiveThread] = useState(communicationsData.threads[0])
  const { threads, notifications, approvals, comments } = communicationsData

  return (
    <>
      <PageHeader
        title="Communication Center"
        description="NGO messaging, notifications, approval workflows, and shared comments."
      />

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-1">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4" /> NGO Messages
          </h3>
          <ul className="space-y-1">
            {threads.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setActiveThread(t)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    activeThread?.id === t.id ? 'bg-primary-50 text-primary-900' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium truncate">{t.ngo}</span>
                    {t.unread > 0 && <Badge variant="primary">{t.unread}</Badge>}
                  </div>
                  <p className="text-slate-500 truncate text-xs mt-0.5">{t.subject}</p>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          {activeThread && (
            <>
              <h4 className="font-semibold text-slate-900">{activeThread.subject}</h4>
              <p className="text-sm text-slate-500 mb-4">{activeThread.ngo} · Updated {activeThread.updated}</p>
              <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700 mb-4">
                {activeThread.lastMessage}
              </div>
              <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-2" rows={3} placeholder="Reply..." />
              <Button size="sm">Send Reply</Button>
            </>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </h3>
          <ul className="space-y-3">
            {notifications.map((n) => (
              <li key={n.id} className={`text-sm p-3 rounded-lg ${n.read ? 'bg-slate-50' : 'bg-primary-50 border border-primary-100'}`}>
                <p className="font-medium text-slate-900">{n.title}</p>
                <p className="text-slate-600 mt-0.5">{n.body}</p>
                <p className="text-xs text-slate-400 mt-1">{n.date}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Approval Workflows
          </h3>
          <ul className="space-y-3">
            {approvals.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-3 last:border-0">
                <div>
                  <p className="font-medium text-slate-900">{a.title}</p>
                  <p className="text-slate-500">{a.requester} · {a.amount}</p>
                </div>
                <Badge variant={a.status === 'approved' ? 'verified' : 'warning'}>{a.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <MessageCircle className="h-4 w-4" /> Shared Comments
        </h3>
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="text-sm border-l-2 border-primary-200 pl-3">
              <p className="font-medium text-slate-900">{c.author} · {c.project}</p>
              <p className="text-slate-600 mt-0.5">{c.text}</p>
              <p className="text-xs text-slate-400 mt-1">{c.date}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-2">Email Integration</h3>
        <p className="text-sm text-slate-600">Connect your corporate email to sync NGO communications and approval notifications.</p>
        <Button variant="secondary" size="sm" className="mt-3">Configure Email — Coming Soon</Button>
      </Card>
    </>
  )
}
