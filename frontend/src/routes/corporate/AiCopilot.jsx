import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { copilotSuggestions, getCopilotResponse } from '../../data/corporate/copilot-suggestions'

export default function AiCopilot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I\'m your CSR Copilot. Ask me about obligations, NGO recommendations, compliance risks, or budget optimization.' },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function sendMessage(text) {
    if (!text.trim()) return
    setMessages((m) => [...m, { role: 'user', text: text.trim() }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'assistant', text: getCopilotResponse(text) }])
      setTyping(false)
    }, 800)
  }

  return (
    <>
      <PageHeader
        title="AI Copilot"
        description="Ask CSR questions, get NGO suggestions, and analyze compliance risks."
      />

      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary-600" /> Suggested Prompts
          </h3>
          <ul className="space-y-2">
            {copilotSuggestions.map((prompt) => (
              <li key={prompt}>
                <button
                  type="button"
                  className="w-full text-left text-sm text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg px-3 py-2 transition-colors"
                  onClick={() => sendMessage(prompt)}
                >
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-3 flex flex-col" padding={false}>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[400px] max-h-[60vh]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  {msg.text.split('**').map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-xl px-4 py-3 text-sm text-slate-500">Thinking...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form
            className="border-t border-slate-200 p-4 flex gap-2"
            onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a CSR question..."
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button type="submit" disabled={!input.trim() || typing}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    </>
  )
}
