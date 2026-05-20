import { z } from 'zod'

export const corporateSignupSchema = z.object({
  companyName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  acceptTerms: z.literal(true),
  enableMfa: z.boolean().optional(),
})

export const corporateLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
  token: z.string().min(1),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const mfaVerifySchema = z.object({
  mfaSessionId: z.string().min(1),
  code: z.string().length(6),
})

export const inviteTeamSchema = z.object({
  invites: z.array(z.object({
    email: z.string().email(),
    role: z.enum(['csr_head', 'esg_head', 'finance', 'compliance', 'volunteer', 'board']),
  })).min(1),
})

export const ngoRegisterSchema = z.object({
  ngoName: z.string().min(2),
  registrationNumber: z.string().min(1),
  email: z.string().email(),
  contactPerson: z.string().min(2),
  password: z.string().min(8),
  sectors: z.array(z.string()).min(1),
})

export const ngoLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  message: z.string().min(10),
})

export const demoBookingSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().min(2),
  role: z.string().min(1),
  employees: z.string().min(1),
  preferredDate: z.string().min(1),
  preferredTime: z.string().min(1),
  notes: z.string().optional(),
})
