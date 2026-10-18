/**
 * Seeds workspaces, projects, routines and starter templates. Safe to re-run: existing rows are left alone.
 * Run: npm run db:seed
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as s from "./schema";
import { SWEEP_ITEMS, type StoredItem } from "../domain/routines";
import { STARTER_TEMPLATES } from "../domain/templates";

const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
const db = drizzle(client, { schema: s });

const WORKSPACES = [
  { id: "ws_softsora", slug: "softsora", name: "SoftSora", color: "indigo", isPrimary: true, sort: 0 },
  { id: "ws_tutorkit", slug: "tutorkit", name: "TutorKit", color: "teal", isPrimary: false, sort: 1 },
  { id: "ws_freelance", slug: "freelance", name: "Freelance", color: "raspberry", isPrimary: false, sort: 2 },
  { id: "ws_admin", slug: "admin", name: "Admin & sales", color: "amber", isPrimary: false, sort: 3 },
];

const PROJECTS = [
  { id: "pr_gaku", workspaceId: "ws_softsora", name: "Gaku", code: "GK", color: "indigo", hasStaging: true, sort: 0 },
  { id: "pr_otasuke", workspaceId: "ws_softsora", name: "Otasuke", code: "OT", color: "violet", hasStaging: false, sort: 1 },
  { id: "pr_olly", workspaceId: "ws_softsora", name: "Olly", code: "OL", color: "sky", hasStaging: true, sort: 2 },
  { id: "pr_mathrix", workspaceId: "ws_tutorkit", name: "Mathrix", code: "MX", color: "teal", hasStaging: false, sort: 0 },
  { id: "pr_tutorkit_io", workspaceId: "ws_tutorkit", name: "tutorkit.io", code: "TK", color: "green", hasStaging: false, sort: 1 },
  { id: "pr_mis", workspaceId: "ws_freelance", name: "MIS", code: "MIS", color: "raspberry", hasStaging: false, billable: true, sort: 0 },
  { id: "pr_wedding", workspaceId: "ws_freelance", name: "Wedding", code: "WD", color: "violet", hasStaging: false, billable: true, sort: 1 },
  { id: "pr_rotary", workspaceId: "ws_freelance", name: "Rotary", code: "RT", color: "sky", hasStaging: false, billable: true, sort: 2 },
  { id: "pr_invoices", workspaceId: "ws_admin", name: "Invoices", code: "INV", color: "amber", hasStaging: false, sort: 0 },
  { id: "pr_quotes", workspaceId: "ws_admin", name: "Quotes", code: "QT", color: "slate", hasStaging: false, sort: 1 },
];

const ROUTINES: { key: string; title: string; note: string | null; weekdays: number[]; sort: number; items: StoredItem[] }[] = [
  {
    key: "sweep", title: "Morning sweep", note: "30 minutes, before opening any code", weekdays: [1, 2, 3, 4, 5], sort: 0,
    items: SWEEP_ITEMS,
  },
  {
    key: "admin", title: "Admin slot", note: "Invoices, quotations, follow-ups", weekdays: [5], sort: 1,
    items: [{ text: "Invoice anything delivered this week", signal: "invoice" }, "Follow up on pending quotations", "Overflow and catch-up"],
  },
  { key: "tk_sat", title: "TutorKit block", note: "Content, design, marketing", weekdays: [6], sort: 2, items: ["Move one TutorKit content or marketing item forward"] },
  { key: "tk_sun", title: "TutorKit deep block", note: null, weekdays: [0], sort: 3, items: ["One build session on TutorKit or Mathrix"] },
  {
    key: "review", title: "Weekly review", note: "20 minutes", weekdays: [0], sort: 4,
    items: [
      "Empty your head into quick add",
      "Give every task a project and a type",
      "Walk the workspaces: SoftSora, TutorKit, Freelance, Admin",
      { text: "Check the money: delivered but not invoiced, unpaid invoices", signal: "invoice" },
      "Every pending quote has a follow-up date",
      { text: "Check what's not in production: anything stuck?", signal: "production" },
      "Star three: one each from SoftSora, TutorKit, Freelance",
    ],
  },
];

async function main() {
  await db.insert(s.workspaces).values(WORKSPACES).onConflictDoNothing();
  await db.insert(s.projects).values(PROJECTS).onConflictDoNothing();
  await db.insert(s.routines).values(ROUTINES).onConflictDoNothing();
  await db.insert(s.templates).values(STARTER_TEMPLATES.map((t, sort) => ({ ...t, sort }))).onConflictDoNothing();
  const counts = await Promise.all([db.$count(s.workspaces), db.$count(s.projects), db.$count(s.routines)]);
  console.log(`Seeded: ${counts[0]} workspaces, ${counts[1]} projects, ${counts[2]} routines`);
  client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
