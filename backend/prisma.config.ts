import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// CLI-only connection (introspect, migrate, studio). Uses the DIRECT
// (non-pooled) connection because Supabase's PgBouncer transaction-mode
// pooler on DATABASE_URL doesn't support the session-level features Prisma
// Migrate needs. The running API server never uses this file — it connects
// through the pooled DATABASE_URL via the adapter in src/db.ts instead.
//
// Read leniently (not prisma/config's env(), which throws when unset):
// `prisma generate` runs on every install — including a deploy's build step —
// and needs no database. Commands that do connect still fail loudly without it.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  ...(process.env.DIRECT_URL && { datasource: { url: process.env.DIRECT_URL } }),
})
