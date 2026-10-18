import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema as s } from "@/lib/db/client";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";
import { IMAGE_MAX, IMAGE_TYPES, imagePath } from "@/lib/domain/notes";
import { saveImage } from "@/lib/storage/images";

/** What the first bytes of each allowed type look like, so a file can't claim to be an image it isn't. */
const MAGIC: Record<(typeof IMAGE_TYPES)[number], (b: Uint8Array) => boolean> = {
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/gif": (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46,
  "image/webp": (b) => b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
};

const fail = (message: string, status = 400) => Response.json({ error: message }, { status });

/** Stores an image pasted into a note: multipart form with noteId and file. Answers with the path to put in the note. */
export async function POST(req: Request) {
  if (!(await verifySession((await cookies()).get(SESSION_COOKIE)?.value))) return fail("Sign in first.", 401);
  const form = await req.formData().catch(() => null);
  const noteId = String(form?.get("noteId") ?? "");
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("No image in the upload.");
  const type = file.type as (typeof IMAGE_TYPES)[number];
  if (!IMAGE_TYPES.includes(type)) return fail("Images can be PNG, JPEG, GIF or WebP.");
  if (file.size > IMAGE_MAX) return fail("That image is over 4 MB.");
  if (!(await db.$count(s.notes, and(eq(s.notes.id, noteId), isNull(s.notes.deletedAt))))) return fail("This note was deleted.", 404);

  const bytes = await file.arrayBuffer();
  if (!MAGIC[type](new Uint8Array(bytes, 0, Math.min(12, bytes.byteLength)))) return fail("That file isn't the image it says it is.");

  const id = `ni_${crypto.randomUUID()}`;
  const key = `notes/${id}`;
  await saveImage(key, bytes, type);
  await db.insert(s.noteImages).values({ id, noteId, key, contentType: type, size: bytes.byteLength });
  return Response.json({ id, path: imagePath(id) });
}
