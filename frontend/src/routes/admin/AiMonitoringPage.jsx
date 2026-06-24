import { PageHeader } from '../../components/corporate/PageHeader'
import { StatCard } from '../../components/corporate/StatCard'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { AreaChartCard } from '../../components/corporate/Charts'
import { aiMonitoring } from '../../data/admin/ai-monitoring'

export default function AiMonitoringPage() {
  const { usage, flagged, latencyTrend } = aiMonitoring

  return (
    <>
      <PageHeader title="AI Monitoring" description="Copilot usage, flagged prompts, and model performance." />
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Queries" value={usage.totalQueries.toLocaleString()} />
        <StatCard label="Unique Users" value={usage.uniqueUsers} />
        <StatCard label="Avg Latency" value={`${usage.avgLatencyMs}ms`} />
      </div>
      <AreaChartCard title="Latency Trend (ms)" data={latencyTrend} lines={[{ key: 'ms', color: '#6366f1', name: 'Latency' }]} xKey="hour" />
      <Card className="mt-6">
        <h3 className="font-semibold text-slate-900 mb-4">Flagged Interactions</h3>
        <ul className="space-y-3">
          {flagged.map((f) => (
            <li key={f.id} className="text-sm border-b border-slate-100 pb-3 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={f.severity === 'critical' ? 'warning' : 'default'}>{f.severity}</Badge>
                <span className="text-slate-500">{f.user} · {f.date}</span>
              </div>
              <p className="text-slate-700 font-mono text-xs bg-slate-50 rounded px-2 py-1">{f.prompt}</p>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}
