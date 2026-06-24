import { z } from 'zod'

export const copilotChatSchema = z.object({
  message: z.string().min(1).max(4000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
})

export const matchNgosSchema = z.object({
  csrFocus: z.string().min(1).max(2000).optional(),
  goals: z.string().min(1).max(2000).optional(),
  keywords: z.string().max(500).optional(),
  state: z.string().max(64).optional(),
  sdg: z.enum(['all', '1', '3', '4', '5', '6', '8', '10', '13', '15']).optional(),
  theme: z.string().optional(),
  impact: z.enum(['all', 'climate', 'livelihood', 'child-welfare', 'water-sanitation']).optional(),
  budgetRange: z.enum(['All', 'Under 10L', '10L-25L', '25L-50L', '50L-1Cr', '1Cr+']).optional(),
  sdgs: z.array(z.string()).optional(),
}).refine((data) => !!(data.csrFocus || data.goals), {
  message: 'csrFocus or goals is required',
})

export const aiSearchSchema = z.object({
  query: z.string().min(1).max(500),
})

export const ragRecommendSchema = z.object({
  query: z.string().min(1).max(2000),
})

export const narrativeSchema = z.object({
  reportId: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
})
