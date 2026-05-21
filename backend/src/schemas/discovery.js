import { z } from 'zod'

export const contactNgoSchema = z.object({
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
})
