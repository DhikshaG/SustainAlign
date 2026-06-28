import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema-pg.js',
  out: './drizzle-pg',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sustainalign',
  },
})
