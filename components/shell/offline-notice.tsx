"use client";
import { useOffline } from "next/offline";

/** A strip across the top while the connection is down. Saves made meanwhile wait and go through when it's back. */
export function OfflineNotice() {
  const offline = useOffline();
  return (
    <div role="status" aria-live="polite">
      {offline ? (
        <p className="fixed inset-x-0 top-0 z-50 border-b border-line bg-surface px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-center text-sm">
          You&apos;re offline. Changes will save when the connection comes back.
        </p>
      ) : null}
    </div>
  );
}
