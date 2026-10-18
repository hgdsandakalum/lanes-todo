import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Not found</h1>
      <p className="mt-2 text-muted">That page doesn&apos;t exist, or what it showed was deleted.</p>
      <Link href="/" className="mt-4 inline-block font-medium underline decoration-queen decoration-2 underline-offset-4">
        Back to Today
      </Link>
    </div>
  );
}
