"use client";
import { useState, useTransition } from "react";
import { setInvoiced } from "@/lib/actions/invoices";

export function InvoiceButton({ taskId, title }: { taskId: string; title: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  return (
    <span className="flex items-baseline gap-2">
      {error ? (
        <span role="alert" className="text-danger">
          Couldn&apos;t save. Try again.
        </span>
      ) : null}
      <button
        type="button"
        disabled={pending}
        aria-label={`Mark ${title} invoiced`}
        onClick={() =>
          start(async () => {
            setError(false);
            try {
              await setInvoiced(taskId, true);
            } catch {
              setError(true);
            }
          })
        }
        className="font-medium text-ink underline decoration-queen decoration-2 underline-offset-4 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Mark invoiced"}
      </button>
    </span>
  );
}
