import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";
import { readImage } from "@/lib/storage/images";

/** A note's image, for signed-in visitors only. Images never change, so the browser keeps them. */
export async function GET(_req: Request, ctx: RouteContext<"/api/notes/images/[id]">) {
  if (!(await verifySession((await cookies()).get(SESSION_COOKIE)?.value))) return new Response("Sign in first.", { status: 401 });
  const { id } = await ctx.params;
  const [img] = await db.select().from(s.noteImages).where(eq(s.noteImages.id, id)).limit(1);
  const stream = img ? await readImage(img.key) : null;
  if (!img || !stream) return new Response("Not found.", { status: 404 });
  return new Response(stream, {
    headers: {
      "content-type": img.contentType,
      "content-length": String(img.size),
      "cache-control": "private, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'",
    },
  });
}
