import { z } from 'zod'

export const corporateSignupSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  email: z.string().email('Valid work email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  enableMfa: z.boolean().optional(),
})

export const corporateLoginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email required'),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const mfaVerifySchema = z.object({
  mfaSessionId: z.string().min(1, 'Session expired — please log in again'),
  code: z.string().length(6, 'Enter the 6-digit code'),
})

export const inviteTeamSchema = z.object({
  invites: z.array(z.object({
    email: z.string().email('Valid email required'),
    role: z.enum(['csr_head', 'esg_head', 'finance', 'compliance', 'volunteer', 'board']),
  })).min(1, 'Add at least one team member'),
})

export const ngoRegisterSchema = z.object({
  ngoName: z.string().min(2, 'NGO name is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  email: z.string().email('Valid email required'),
  contactPerson: z.string().min(2, 'Contact person is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  sectors: z.array(z.string()).min(1, 'Select at least one sector'),
})

export const ngoLoginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password is required'),
})

export const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  company: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export const demoBookingSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid work email required'),
  company: z.string().min(2, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  employees: z.string().min(1, 'Select company size'),
  preferredDate: z.string().min(1, 'Preferred date is required'),
  preferredTime: z.string().min(1, 'Preferred time is required'),
  notes: z.string().optional(),
})

export const CORPORATE_ROLES = [
  { value: 'csr_head', label: 'CSR Head' },
  { value: 'esg_head', label: 'ESG Head' },
  { value: 'finance', label: 'Finance Officer' },
  { value: 'compliance', label: 'Compliance Officer' },
  { value: 'volunteer', label: 'Employee Volunteer' },
  { value: 'board', label: 'Board Member (View Only)' },
]

export const NGO_SECTORS = [
  'Education', 'Healthcare', 'Environment', 'Livelihood', 'Women Empowerment',
  'Child Welfare', 'Disaster Relief', 'Rural Development', 'Disability', 'Other',
]
