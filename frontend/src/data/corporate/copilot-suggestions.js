export const copilotSuggestions = [
  'What is my CSR obligation for FY25?',
  'Suggest NGOs for education in Karnataka',
  'Generate Q4 impact summary',
  'Analyze compliance risks',
  'Optimize budget allocation across themes',
]

export const copilotResponses = [
  {
    keywords: ['obligation', 'csr obligation', 'section 135', '2%'],
    response: 'Based on FY25 net profit of ₹45 Cr, your CSR obligation is **₹90 L** (2% of average net profit). You have spent ₹1.42 Cr including carry-forward from FY24. Unspent amount of ₹1.08 Cr requires a transfer plan by March 31.',
  },
  {
    keywords: ['ngo', 'suggest', 'education', 'karnataka'],
    response: 'Top AI-matched NGOs for Education in Karnataka:\n\n1. **EduRise India** — 4.6★, verified, 150 digital centers\n2. **Child Hope Initiative** — strong urban slum focus\n\nWould you like to compare them or view full profiles?',
  },
  {
    keywords: ['report', 'impact', 'summary', 'generate'],
    response: '**Q4 Impact Summary (Draft)**\n\n- Total beneficiaries: 2.85L\n- Active projects: 14\n- Top performer: Health For All Trust (94 score)\n- SDGs covered: 8\n\nI can export this as PDF or CSV. Say "download report" to proceed.',
  },
  {
    keywords: ['compliance', 'risk', 'alert'],
    response: '**Compliance Risk Analysis**\n\n🔴 Critical: Q3 UC overdue (SkillBuild)\n🟡 Warning: ₹1.08 Cr unspent CSR needs transfer plan\n🟡 Warning: 62% local spend vs 70% preference\n🟢 Pass: Admin overhead within 5% cap\n\nAudit readiness: 78%. Recommend collecting 2 pending utilization certificates.',
  },
  {
    keywords: ['budget', 'optimize', 'allocation'],
    response: '**Budget Optimization Suggestion**\n\nCurrent vs recommended allocation:\n- Healthcare: 25% → 24% (slightly over)\n- Education: 20% → 22% (increase recommended)\n- Environment: 18% → 20% (industry benchmark gap)\n\nShifting ₹5L from Reserve to Education would improve Schedule VII balance.',
  },
]

export function getCopilotResponse(input) {
  const lower = input.toLowerCase()
  for (const item of copilotResponses) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return item.response
    }
  }
  return 'I can help with CSR obligations, NGO recommendations, compliance analysis, impact reports, and budget optimization. Try one of the suggested prompts below, or ask a specific question about your CSR program.'
}
