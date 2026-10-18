"use client";
import { useEffect, useState } from "react";
import { XpNote } from "./xp-note";

const EVENT = "lanes:xp";

/** Tells the level bar that XP changed. Call after any action that returns an XP change. */
export function announceXp(amount: number) {
  if (amount !== 0) window.dispatchEvent(new CustomEvent<number>(EVENT, { detail: amount }));
}

/**
 * Sits beside the level bar and shows "+30 XP" whenever an action earns XP. Lives in the shell,
 * so the note survives the earning row disappearing (a task that closes leaves the list).
 */
export function XpPulse() {
  const [xp, setXp] = useState({ amount: 0, id: 0 });
  useEffect(() => {
    const on = (e: Event) => setXp((prev) => ({ amount: (e as CustomEvent<number>).detail, id: prev.id + 1 }));
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return <XpNote amount={xp.amount} id={xp.id} />;
}
