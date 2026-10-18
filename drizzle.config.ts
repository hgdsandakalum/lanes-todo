import { defineConfig } from "drizzle-kit";

try { process.loadEnvFile(".env.local"); } catch { /* use the shell's env */ }

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  },
});
