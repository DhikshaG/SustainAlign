import { z } from 'zod'

export const kpiInputSchema = z.object({
  metricKey: z.string().min(1).max(64),
  label: z.string().min(1).max(128),
  value: z.union([z.string(), z.number()]),
  unit: z.string().max(32).optional(),
})

export const beneficiaryLogSchema = z.object({
  directCount: z.number().int().min(0),
  indirectCount: z.number().int().min(0).default(0),
  note: z.string().max(500).optional(),
})

export const geoUpdateSchema = z.object({
  state: z.string().min(1).max(64),
  district: z.string().max(64).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  note: z.string().max(500).optional(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const attachUpdateFilesSchema = z.object({
  fileIds: z.array(z.string().min(1)).min(1),
})
