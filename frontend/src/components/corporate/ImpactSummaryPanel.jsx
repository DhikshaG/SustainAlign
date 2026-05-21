import { useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Alert'
import { generateImpactSummary } from '../../lib/impact'

export function ImpactSummaryPanel() {
  const [summary, setSummary] = useState('')
  const [offline, setOffline] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const result = await generateImpactSummary()
      setSummary(result.summary || '')
      setOffline(!!result.offline)
    } catch (err) {
      setError(err.message || 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary-600" />
          AI Impact Summary
        </h3>
        <Button variant="secondary" size="sm" onClick={handleGenerate} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generating…' : 'Generate'}
        </Button>
      </div>

      {offline && (
        <Alert variant="warning" className="mb-3">
          AI is offline — showing fallback message. Start Ollama for live summaries.
        </Alert>
      )}
      {error && <Alert variant="error" className="mb-3">{error}</Alert>}

      {summary ? (
        <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
      ) : (
        <p className="text-sm text-slate-500">
          Generate an executive summary of your CSR impact using live project data.
        </p>
      )}
    </Card>
  )
}
