import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_DIALECT: z.enum(['sqlite', 'pg']).default('sqlite'),
  DATABASE_PATH: z.string().default('./data/sustainalign.db'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/sustainalign'),
  JWT_SECRET: z.string().default('dev-secret-change-me-in-production-32chars'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret-change-me-prod-32'),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(7),
  APP_URL: z.string().default('http://localhost:5173'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  STORAGE_PROVIDER: z.enum(['local']).default('local'),
  UPLOAD_ROOT: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama3.1:1b'),
  OLLAMA_EMBED_MODEL: z.string().default('nomic-embed-text'),
  AI_ENABLED: z.union([z.boolean(), z.string()]).default(true),
  COMPLIANCE_SYNC_INTERVAL_MINUTES: z.coerce.number().default(60),
  TRUST_PROXY: z.coerce.number().default(1),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SENTRY_DSN: z.string().optional(),
  PROMETHEUS_ENABLED: z.union([z.boolean(), z.string()]).default(false),
})

const parsed = envSchema.parse(process.env)

function validateProduction(env) {
  if (env.NODE_ENV !== 'production') return
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'APP_URL']
  if (env.DB_DIALECT === 'sqlite') {
    required.push('DATABASE_PATH')
  } else {
    required.push('DATABASE_URL')
  }
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required production env: ${key}`)
    }
  }
  if (env.JWT_SECRET.length < 32 || env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT secrets must be at least 32 characters in production')
  }
  if (env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must differ in production')
  }
}

validateProduction(parsed)
export const env = parsed
