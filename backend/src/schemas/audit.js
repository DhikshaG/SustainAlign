import { z } from 'zod'

export const auditQuerySchema = z.object({
  actionType: z.enum(['upload', 'approval', 'payment', 'edit', 'all']).optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  projectId: z.string().optional(),
  fiscalYear: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  tenantId: z.string().optional(),
})

export const auditExportSchema = z.object({
  projectId: z.string().optional(),
  fiscalYear: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export const fileVersionSchema = z.object({
  changeNote: z.string().max(500).optional(),
})
