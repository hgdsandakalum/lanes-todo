import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";

// Optimistic check only: reads the signed cookie, never the database.
export async function proxy(req: NextRequest) {
  const signedIn = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const onLogin = req.nextUrl.pathname === "/login";
  if (!signedIn && !onLogin) return NextResponse.redirect(new URL("/login", req.nextUrl));
  if (signedIn && onLogin) return NextResponse.redirect(new URL("/", req.nextUrl));
  return NextResponse.next();
}

export const config = {
  // /api/cli checks its own bearer token (the lanes command has no cookie)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|api/cli$).*)"],
};
