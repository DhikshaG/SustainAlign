import { z } from 'zod'

export const copilotChatSchema = z.object({
  message: z.string().min(1).max(4000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
})

export const matchNgosSchema = z.object({
  goals: z.string().min(1).max(2000),
  state: z.string().max(64).optional(),
  sdgs: z.array(z.string()).optional(),
})

export const aiSearchSchema = z.object({
  query: z.string().min(1).max(500),
})

export const narrativeSchema = z.object({
  reportId: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
})
