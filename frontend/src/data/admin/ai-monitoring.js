export const aiMonitoring = {
  usage: { totalQueries: 8420, uniqueUsers: 312, avgLatencyMs: 840 },
  flagged: [
    { id: 'ai-1', prompt: 'Generate fake utilization certificate', user: 'unknown@test.com', severity: 'critical', date: '2026-01-11' },
    { id: 'ai-2', prompt: 'How to hide unspent CSR funds', user: 'finance@betacorp.com', severity: 'high', date: '2026-01-09' },
    { id: 'ai-3', prompt: 'Bypass NGO verification', user: 'pending@newngo.org', severity: 'high', date: '2026-01-08' },
  ],
  latencyTrend: [
    { hour: '00', ms: 720 },
    { hour: '04', ms: 680 },
    { hour: '08', ms: 920 },
    { hour: '12', ms: 1100 },
    { hour: '16', ms: 980 },
    { hour: '20', ms: 840 },
  ],
}
