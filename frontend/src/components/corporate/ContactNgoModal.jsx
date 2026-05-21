import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { contactNgo } from '../../lib/discovery'

export function ContactNgoModal({ ngo, onClose, onSuccess }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const result = await contactNgo(ngo.slug, { subject, message })
      onSuccess?.(result)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to send message')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <Card className="w-full max-w-md">
        <h3 className="font-semibold text-slate-900 mb-1">Contact {ngo.name}</h3>
        {ngo.contactPerson && (
          <p className="text-sm text-slate-500 mb-4">Primary contact: {ngo.contactPerson}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={4}
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Send'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
