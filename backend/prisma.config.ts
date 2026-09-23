import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// CLI-only connection (introspect, migrate, studio). Uses the DIRECT
// (non-pooled) connection because Supabase's PgBouncer transaction-mode
// pooler on DATABASE_URL doesn't support the session-level features Prisma
// Migrate needs. The running API server never uses this file — it connects
// through the pooled DATABASE_URL via the adapter in src/db.ts instead.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
})
