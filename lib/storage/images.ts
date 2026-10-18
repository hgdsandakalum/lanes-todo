import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { del, get, put } from "@vercel/blob";

/**
 * Where note images live. On Vercel: a private Blob store (connected to the project, so BLOB_STORE_ID or
 * BLOB_READ_WRITE_TOKEN is set), read only through /api/notes/images/[id], which checks the session.
 * Locally, and in the browser tests: uploads/ beside the database file.
 */
const onBlob = () => Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);

function uploadsDir() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.startsWith("file:")) throw new Error("No image storage: connect a Vercel Blob store, or run on a local database.");
  return join(/*turbopackIgnore: true*/ dirname(resolve(url.slice("file:".length))), "uploads");
}

// keys are made by us (notes/<id>), but never let one climb out of the uploads folder
const safe = (key: string) => {
  if (!/^notes\/ni_[\w-]+$/.test(key)) throw new Error("Bad image key.");
  return key;
};

export async function saveImage(key: string, bytes: ArrayBuffer, contentType: string) {
  if (onBlob()) {
    await put(safe(key), bytes, { access: "private", contentType, addRandomSuffix: false });
    return;
  }
  const file = join(uploadsDir(), safe(key));
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, Buffer.from(bytes));
}

/** The image's bytes as a stream, or null if it's gone. */
export async function readImage(key: string): Promise<ReadableStream<Uint8Array> | null> {
  if (onBlob()) return (await get(safe(key), { access: "private" }))?.stream ?? null;
  try {
    const data = await readFile(join(uploadsDir(), safe(key)));
    return new Blob([data]).stream();
  } catch {
    return null;
  }
}

export async function deleteImages(keys: string[]) {
  if (!keys.length) return;
  if (onBlob()) {
    await del(keys.map(safe));
    return;
  }
  const dir = uploadsDir();
  await Promise.all(keys.map((k) => rm(join(dir, safe(k)), { force: true })));
}
