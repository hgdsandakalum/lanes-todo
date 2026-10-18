"use server";
import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { createSession, deleteSession } from "./session";

const digest = (s: string) => createHash("sha256").update(s).digest();

export type LoginState = { error?: string } | undefined;

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return { error: "APP_PASSWORD is not set on the server." };
  const given = String(form.get("passcode") ?? "");
  // Fixed delay slows down guessing; compare digests in constant time.
  await new Promise((r) => setTimeout(r, 400));
  if (!timingSafeEqual(digest(given), digest(expected))) return { error: "That passcode is wrong. Try again." };
  await createSession();
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
