export const fundAllocation = {
  totalBudget: 25000000,
  themes: [
    { name: 'Healthcare', allocated: 6250000, spent: 4100000, recommended: 6000000 },
    { name: 'Education', allocated: 5000000, spent: 3200000, recommended: 5500000 },
    { name: 'Environment', allocated: 4500000, spent: 2800000, recommended: 5000000 },
    { name: 'Livelihood', allocated: 3750000, spent: 2100000, recommended: 3500000 },
    { name: 'Rural Development', allocated: 2500000, spent: 1200000, recommended: 2500000 },
    { name: 'Reserve', allocated: 3000000, spent: 0, recommended: 2500000 },
  ],
  districts: [
    { rank: 1, district: 'Pune, Maharashtra', priority: 'high', allocation: 3200000, sdgGap: 'SDG 13' },
    { rank: 2, district: 'Chennai, Tamil Nadu', priority: 'high', allocation: 2800000, sdgGap: 'SDG 3' },
    { rank: 3, district: 'Bangalore Rural, Karnataka', priority: 'medium', allocation: 2100000, sdgGap: 'SDG 4' },
    { rank: 4, district: 'Jaipur, Rajasthan', priority: 'medium', allocation: 1800000, sdgGap: 'SDG 8' },
    { rank: 5, district: 'Bhubaneswar, Odisha', priority: 'low', allocation: 1200000, sdgGap: 'SDG 6' },
  ],
  simulations: {
    baseline: { education: 20, healthcare: 25, environment: 18, livelihood: 15, rural: 10, reserve: 12 },
    aggressive: { education: 15, healthcare: 30, environment: 22, livelihood: 12, rural: 8, reserve: 13 },
    balanced: { education: 22, healthcare: 22, environment: 20, livelihood: 14, rural: 12, reserve: 10 },
  },
  forecast: [
    { month: 'Feb', projected: 15500000, actual: null },
    { month: 'Mar', projected: 17200000, actual: null },
    { month: 'Apr', projected: 19500000, actual: null },
    { month: 'May', projected: 21800000, actual: null },
    { month: 'Jun', projected: 24000000, actual: null },
    { month: 'Jul', projected: 25000000, actual: null },
  ],
}
