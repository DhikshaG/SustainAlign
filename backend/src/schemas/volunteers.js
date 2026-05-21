import { z } from 'zod'

export const createVolunteerEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().min(2).max(200),
  startsAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  endsAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  slots: z.coerce.number().int().min(1).max(10000),
  hoursCredit: z.coerce.number().min(0.5).max(24).optional(),
  status: z.enum(['draft', 'open']).optional(),
})

export const updateVolunteerEventSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  location: z.string().min(2).max(200).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  slots: z.coerce.number().int().min(1).max(10000).optional(),
  hoursCredit: z.coerce.number().min(0.5).max(24).optional(),
  status: z.enum(['draft', 'open', 'full', 'completed', 'cancelled']).optional(),
})

export const volunteerCheckInSchema = z.object({
  token: z.string().uuid(),
})

export const manualAttendanceSchema = z.object({
  signupIds: z.array(z.string().uuid()).min(1),
})

export const volunteerEventsQuerySchema = z.object({
  status: z.enum(['draft', 'open', 'full', 'completed', 'cancelled']).optional(),
})
