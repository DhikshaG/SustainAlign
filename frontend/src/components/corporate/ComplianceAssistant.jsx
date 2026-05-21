import { useState } from 'react'
import { Sparkles, Send } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { sendCopilotMessage } from '../../lib/copilot'
import { generateNarrative } from '../../lib/reporting'

const QUICK_PROMPTS = [
  'Explain my unspent CSR obligation and what I should do',
  'Which Schedule VII validations are failing and why?',
  'Summarize compliance status for the board in 3 sentences',
]

export function ComplianceAssistant() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [narrative, setNarrative] = useState(null)

  async function ask(text) {
    if (!text.trim()) return
    setLoading(true)
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    try {
      const history = messages.map((msg) => ({ role: msg.role, content: msg.text }))
      const result = await sendCopilotMessage(text.trim(), history)
      setMessages((m) => [...m, { role: 'assistant', text: result.reply }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: err.message || 'Request failed' }])
    } finally {
      setLoading(false)
    }
  }

  async function draftBoardParagraph() {
    setLoading(true)
    try {
      const result = await generateNarrative({})
      setNarrative(result.narrative)
    } catch (err) {
      setNarrative(err.message || 'Failed to generate narrative')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary-600" /> AI Compliance Assistant
      </h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            className="text-xs text-left rounded-lg border border-slate-200 px-2 py-1.5 hover:bg-primary-50 hover:border-primary-200"
            onClick={() => ask(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <Button variant="secondary" size="sm" className="mb-3" onClick={draftBoardParagraph} disabled={loading}>
        Draft board summary paragraph
      </Button>
      {narrative && (
        <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 mb-3 italic">{narrative}</p>
      )}
      {messages.length > 0 && (
        <div className="max-h-40 overflow-y-auto space-y-2 mb-3 text-sm">
          {messages.map((msg, i) => (
            <div key={i} className={`rounded-lg px-3 py-2 ${msg.role === 'user' ? 'bg-primary-50 ml-4' : 'bg-slate-100 mr-4'}`}>
              {msg.text}
            </div>
          ))}
        </div>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => { e.preventDefault(); ask(input) }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a compliance question…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <Button type="submit" size="sm" disabled={!input.trim() || loading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  )
}
