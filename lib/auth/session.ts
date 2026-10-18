import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./token";

export async function createSession() {
  const expiresAt = Date.now() + SESSION_DAYS * 864e5;
  (await cookies()).set(SESSION_COOKIE, await signSession(expiresAt), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Call at the top of every data loader and server action. proxy.ts is only the first line of defence. */
export async function requireSession() {
  await connection(); // per-request: the expiry check reads the clock
  const ok = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!ok) redirect("/login");
}
