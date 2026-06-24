import { z } from 'zod'

export const generateReportSchema = z.object({
  type: z.enum(['executive', 'impact_stories', 'quarterly', 'board', 'sdg', 'impact', 'mca_csr2']),
  format: z.enum(['pdf', 'docx', 'pptx']).default('pdf'),
  includeAi: z.boolean().default(true),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const previewReportSchema = z.object({
  type: z.enum(['executive', 'impact_stories', 'quarterly', 'board', 'sdg', 'impact', 'mca_csr2']),
  includeAi: z.boolean().default(true),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
