import { defineConfig } from "drizzle-kit";

// The browser tests' own database. Fixed here, never read from .env.local, so a test run can't touch local.db.
export default defineConfig({
  schema: "./lib/db/schema.ts",
  dialect: "turso",
  dbCredentials: { url: "file:e2e/.tmp/test.db" },
});
