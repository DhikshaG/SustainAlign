import { Mail } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

export function MessageThreadList({ threads, activeId, onSelect, counterpartyKey = 'ngoName', emptyLabel = 'No message threads yet.' }) {
  return (
    <Card className="lg:col-span-1">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Mail className="h-4 w-4" /> Messages
      </h3>
      {threads.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="space-y-1">
          {threads.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onSelect(t.id)}
                className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  activeId === t.id ? 'bg-primary-50 text-primary-900' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium truncate">{t[counterpartyKey] || t.subject}</span>
                  {t.unread > 0 && <Badge variant="primary">{t.unread}</Badge>}
                </div>
                <p className="text-slate-500 truncate text-xs mt-0.5">{t.subject}</p>
                {t.preview && (
                  <p className="text-slate-400 truncate text-xs mt-0.5">{t.preview}</p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
