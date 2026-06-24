import { z } from 'zod'

export const allocationIntelligenceSchema = z.object({
  budgetToAllocate: z.number().int().min(0).optional(),
  scenario: z.enum(['baseline', 'balanced', 'aggressive']).default('balanced'),
  sdgFocus: z.array(z.number().int().min(1).max(17)).optional(),
  includeAi: z.boolean().default(true),
  limit: z.number().int().min(1).max(20).default(10),
})
