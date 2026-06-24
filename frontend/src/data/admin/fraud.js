export const fraudAlerts = [
  { id: 'f-1', level: 'high', type: 'Duplicate invoice', entity: 'SkillBuild Foundation / Acme Corp', description: 'Same invoice number submitted twice for Q3', date: '2026-01-11', score: 92 },
  { id: 'f-2', level: 'medium', type: 'Spend anomaly', entity: 'Beta Corp', description: 'Admin overhead spike 8.2% vs 5% cap', date: '2026-01-09', score: 68 },
  { id: 'f-3', level: 'low', type: 'Profile mismatch', entity: 'New NGO Trust', description: 'Registration number format inconsistent', date: '2026-01-07', score: 45 },
]

export const fraudTrend = [
  { month: 'Aug', alerts: 2 },
  { month: 'Sep', alerts: 1 },
  { month: 'Oct', alerts: 4 },
  { month: 'Nov', alerts: 3 },
  { month: 'Dec', alerts: 5 },
  { month: 'Jan', alerts: 3 },
]
