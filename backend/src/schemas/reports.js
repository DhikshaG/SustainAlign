import { z } from 'zod'

export const generateReportSchema = z.object({
  type: z.enum(['quarterly', 'board', 'sdg', 'impact', 'mca_csr2']),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
