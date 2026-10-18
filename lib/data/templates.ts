import "server-only";
import { asc } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";

export async function listTemplates() {
  await requireSession();
  return db.select().from(s.templates).orderBy(asc(s.templates.sort), asc(s.templates.name));
}
