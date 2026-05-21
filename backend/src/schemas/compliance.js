import { z } from 'zod'

export const updateCsrProfileSchema = z.object({
  fyLabel: z.string().max(32).optional(),
  netProfitInr: z.number().int().min(0).optional(),
  turnoverInr: z.number().int().min(0).optional(),
  netWorthInr: z.number().int().min(0).optional(),
  adminCapPct: z.number().min(0).max(100).optional(),
  localAreaTargetPct: z.number().min(0).max(100).optional(),
  carryForwardInr: z.number().int().min(0).optional(),
})
