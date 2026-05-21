import { z } from 'zod'

export const createThreadSchema = z.object({
  ngoTenantId: z.string().min(1).optional(),
  ngoSlug: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000).optional(),
})

export const postMessageSchema = z.object({
  body: z.string().min(1).max(5000),
})

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  assigneeSide: z.enum(['corporate', 'ngo']),
  assigneeUserId: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['open', 'in_progress', 'done', 'cancelled']).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const partnershipResponseSchema = z.object({
  action: z.enum(['accept', 'decline']),
  note: z.string().max(2000).optional(),
})

export const submitMilestoneSchema = z.object({
  note: z.string().max(2000).optional(),
})
