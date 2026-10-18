import "server-only";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");

// Reuse one client across hot reloads in dev.
const g = globalThis as unknown as { __lanesDb?: ReturnType<typeof createClient> };
const client = g.__lanesDb ?? createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
if (process.env.NODE_ENV !== "production") g.__lanesDb = client;

export const db = drizzle(client, { schema });
export { schema };
