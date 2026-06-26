import { defineConfig } from 'drizzle-kit'

const dialect = process.env.DB_DIALECT || 'sqlite'

if (dialect === 'pg') {
  export default defineConfig({
    schema: './src/db/schema.js',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sustainalign',
    },
  })
} else {
  export default defineConfig({
    schema: './src/db/schema.js',
    out: './drizzle',
    dialect: 'sqlite',
    dbCredentials: {
      url: process.env.DATABASE_PATH || './data/sustainalign.db',
    },
  })
}
