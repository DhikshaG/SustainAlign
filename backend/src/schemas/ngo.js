import { z } from 'zod'

export const updateNgoProfileSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  registrationNumber: z.string().min(2).max(100).optional(),
  contactPerson: z.string().max(200).optional(),
  pan: z.string().max(20).optional().nullable(),
  csr1Number: z.string().max(100).optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  statesServed: z.array(z.string()).optional(),
  districtsServed: z.array(z.string()).optional(),
  settlementType: z.enum(['rural', 'urban', 'both']).optional().nullable(),
  yearsActive: z.number().int().min(0).optional().nullable(),
  beneficiariesCount: z.number().int().min(0).optional().nullable(),
  annualFundingInr: z.number().int().min(0).optional().nullable(),
  teamSize: z.number().int().min(0).optional().nullable(),
  projectsCount: z.number().int().min(0).optional().nullable(),
  budgetRange: z.string().optional().nullable(),
  orgSize: z.enum(['small', 'medium', 'large']).optional().nullable(),
  primarySector: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  sectors: z.array(z.string()).optional(),
  tagSlugs: z.array(z.string()).optional(),
}).strict()

export const teamMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
})

export const replaceTeamSchema = z.object({
  members: z.array(teamMemberSchema),
})

export const pastProjectSchema = z.object({
  name: z.string().min(1),
  budget: z.string().optional(),
  budgetLabel: z.string().optional(),
  outcome: z.string().optional(),
  completedAt: z.string().optional().nullable(),
})

export const replacePastProjectsSchema = z.object({
  projects: z.array(pastProjectSchema),
})

export const replaceImpactMetricsSchema = z.object({
  metrics: z.record(z.union([
    z.string(),
    z.number(),
    z.object({ label: z.string().optional(), value: z.union([z.string(), z.number()]) }),
  ])),
})

export const impactStorySchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  date: z.string().optional(),
  publishedAt: z.string().optional(),
  coverFileId: z.string().optional().nullable(),
})

export const certificationSchema = z.object({
  name: z.string().min(1),
  issued: z.string().optional().nullable(),
  issuedAt: z.string().optional().nullable(),
  expires: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  status: z.string().optional(),
})

export const discoveryQuerySchema = z.object({
  state: z.string().optional(),
  location: z.string().optional(),
  verified: z.enum(['true', 'false', 'all']).optional(),
  sdg: z.enum(['all', '1', '3', '4', '5', '6', '8', '10', '13', '15']).optional(),
  theme: z.string().optional(),
  impact: z.enum(['all', 'climate', 'livelihood', 'child-welfare', 'water-sanitation']).optional(),
  tags: z.string().optional(),
  budgetRange: z.enum(['All', 'Under 10L', '10L-25L', '25L-50L', '50L-1Cr', '1Cr+']).optional(),
  orgSize: z.enum(['all', 'small', 'medium', 'large']).optional(),
  q: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

export const platformFieldsSchema = z.object({
  riskScore: z.number().int().min(0).max(100).optional(),
  financialTransparencyScore: z.number().int().min(0).max(100).optional(),
  financialTransparency: z.number().int().min(0).max(100).optional(),
  aiRecommended: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
})
