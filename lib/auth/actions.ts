"use server";
import { createHash, timingSafeEqual } from "node:crypto";
import { eq, gt, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema as s } from "@/lib/db/client";
import { ALL_ADDRESSES, KEEP_MS, lockedFor } from "@/lib/domain/login-limit";
import { createSession, deleteSession } from "./session";

const digest = (s: string) => createHash("sha256").update(s).digest();

export type LoginState = { error?: string } | undefined;

/** The caller's address. On Vercel x-forwarded-for is set by the platform, so its first entry can't be forged. */
async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
}

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return { error: "APP_PASSWORD is not set on the server." };
  const given = String(form.get("passcode") ?? "");
  const ip = await clientIp();
  const now = Date.now();

  // the widest window covers both limits
  const failures = await db
    .select({ ip: s.loginFailures.ip, at: s.loginFailures.at })
    .from(s.loginFailures)
    .where(gt(s.loginFailures.at, now - ALL_ADDRESSES.windowMs));
  const wait = lockedFor(failures, ip, now);
  if (wait) return { error: `Too many wrong passcodes. Try again in ${wait} ${wait === 1 ? "minute" : "minutes"}.` };

  // Fixed delay slows down guessing; compare digests in constant time.
  await new Promise((r) => setTimeout(r, 400));
  if (!timingSafeEqual(digest(given), digest(expected))) {
    await db.insert(s.loginFailures).values({ ip, at: now });
    await db.delete(s.loginFailures).where(lt(s.loginFailures.at, now - KEEP_MS));
    return { error: "That passcode is wrong. Try again." };
  }
  await db.delete(s.loginFailures).where(eq(s.loginFailures.ip, ip));
  await createSession();
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
