import { z } from 'zod'

export const esgUnifiedQuerySchema = z.object({
  includeAi: z.coerce.boolean().default(false),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
})

export const esgSummarySchema = z.object({
  includeAi: z.boolean().default(true),
})
