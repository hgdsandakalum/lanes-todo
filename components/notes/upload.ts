import { IMAGE_MAX, IMAGE_TYPES } from "@/lib/domain/notes";

const LONGEST = 2560;

/** Big screenshots and photos are scaled to 2560px on their longest side and re-encoded as WebP, so they fit the 4 MB limit. GIFs are kept as they are (re-encoding would stop them moving). */
async function shrink(file: File): Promise<Blob> {
  const allowed = (IMAGE_TYPES as readonly string[]).includes(file.type);
  if (file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, LONGEST / Math.max(bitmap.width, bitmap.height));
  if (allowed && scale === 1 && file.size <= IMAGE_MAX) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((done, fail) => canvas.toBlob((b) => (b ? done(b) : fail(new Error("Couldn't read that image."))), "image/webp", 0.85));
}

/** Uploads an image into a note; returns the path to write into the note's text. */
export async function uploadImage(noteId: string, file: File): Promise<string> {
  const blob = await shrink(file);
  if (blob.size > IMAGE_MAX) throw new Error("That image is over 4 MB, even after shrinking it.");
  const form = new FormData();
  form.set("noteId", noteId);
  form.set("file", blob, file.name || "image");
  const res = await fetch("/api/notes/images", { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
  if (!res.ok || !data.path) throw new Error(data.error ?? "Couldn't upload that image.");
  return data.path;
}
