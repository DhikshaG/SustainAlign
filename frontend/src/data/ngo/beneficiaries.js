export const ngoBeneficiaries = {
  summary: { total: 58450, households: 8500, surveysCompleted: 1240 },
  records: [
    { id: 'b-1', name: 'Village cluster — Nashik North', type: 'community', count: 12000, project: 'Green Maharashtra' },
    { id: 'b-2', name: 'Urban residents — Pune', type: 'community', count: 8000, project: 'Urban Tree Cover' },
    { id: 'b-3', name: 'Farmers — Ahmednagar', type: 'individual', count: 450, project: 'Green Maharashtra' },
  ],
  attendance: [
    { id: 'at-1', session: 'Community planting drive', date: '2026-01-05', present: 85, total: 100 },
    { id: 'at-2', session: 'Water conservation workshop', date: '2025-12-20', present: 62, total: 75 },
    { id: 'at-3', session: 'Urban volunteer day', date: '2025-12-15', present: 48, total: 50 },
  ],
  surveys: [
    { id: 'sv-1', title: 'Post-planting satisfaction', responses: 420, avgScore: 4.2, date: '2025-11-30' },
    { id: 'sv-2', title: 'Water access improvement', responses: 380, avgScore: 4.5, date: '2025-10-15' },
  ],
  outcomes: [
    { metric: 'Income improvement', value: '18%', target: '15%' },
    { metric: 'Water access (households)', value: '8,200', target: '10,000' },
    { metric: 'Tree survival rate', value: '76%', target: '80%' },
    { metric: 'Women participants', value: '42%', target: '40%' },
  ],
}
