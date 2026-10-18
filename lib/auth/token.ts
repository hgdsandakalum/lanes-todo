/**
 * Signed session token: "<expiresAtMs>.<hmac>". Uses Web Crypto so it runs in proxy.ts and on the server.
 * No user data inside — there is exactly one user.
 */
const enc = new TextEncoder();
export const SESSION_COOKIE = "lanes_session";
export const SESSION_DAYS = 30;

async function key(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

const toB64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set and at least 32 characters.");
  return s;
}

export async function signSession(expiresAt: number): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await key(secret()), enc.encode(String(expiresAt)));
  return `${expiresAt}.${toB64(sig)}`;
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  const expiresAt = Number(exp);
  if (!sig || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  try {
    return await crypto.subtle.verify("HMAC", await key(secret()), fromB64(sig), enc.encode(exp));
  } catch {
    return false;
  }
}
