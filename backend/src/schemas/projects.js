import { z } from 'zod'

export const PROJECT_STATUSES = [
  'pending_approval',
  'active',
  'on_hold',
  'completed',
  'archived',
  'rejected',
]

export const MILESTONE_STATUSES = ['pending', 'in_progress', 'completed', 'delayed']

export const SCHEDULE_VII_OPTIONS = [
  'Promoting education',
  'Promoting health care',
  'Ensuring environmental sustainability',
  'Eradicating hunger, poverty and malnutrition',
  'Promoting gender equality and empowering women',
  'Ensuring availability of safe drinking water',
]

export const milestoneInputSchema = z.object({
  title: z.string().min(1).max(200),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(MILESTONE_STATUSES).optional(),
  progress: z.number().int().min(0).max(100).optional(),
})

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  ngoTenantId: z.string().min(1).optional(),
  ngoSlug: z.string().min(1).optional(),
  scheduleVii: z.enum(SCHEDULE_VII_OPTIONS),
  theme: z.string().max(100).optional(),
  location: z.string().min(1).max(200),
  budgetInr: z.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  milestones: z.array(milestoneInputSchema).optional(),
}).refine((d) => d.ngoTenantId || d.ngoSlug, {
  message: 'ngoTenantId or ngoSlug is required',
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  ngoTenantId: z.string().min(1).optional(),
  ngoSlug: z.string().min(1).optional(),
  scheduleVii: z.enum(SCHEDULE_VII_OPTIONS).optional(),
  theme: z.string().max(100).optional(),
  location: z.string().min(1).max(200).optional(),
  budgetInr: z.number().int().positive().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
})

export const updateMilestoneSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(MILESTONE_STATUSES).optional(),
  progress: z.number().int().min(0).max(100).optional(),
})

export const createUpdateSchema = z.object({
  body: z.string().min(1).max(5000),
})

export const updateSpentSchema = z.object({
  spentInr: z.number().int().min(0),
})
