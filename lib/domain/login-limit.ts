/**
 * Limits passcode guessing once the app is on the internet. Wrong guesses are counted per address, with a ceiling
 * across all addresses so spreading guesses over many doesn't get around it. A lockout only stops new sign-ins:
 * a browser that's already signed in keeps working.
 */

export const PER_ADDRESS = { max: 5, windowMs: 15 * 60_000 };
export const ALL_ADDRESSES = { max: 30, windowMs: 60 * 60_000 };
/** Failures older than this are of no use to either limit and get cleared. */
export const KEEP_MS = 24 * 60 * 60_000;

export type Failure = { ip: string; at: number };

/** Minutes until another guess is allowed from `ip`, or 0 if one is allowed now. */
export function lockedFor(failures: Failure[], ip: string, now: number): number {
  const waits = [PER_ADDRESS, ALL_ADDRESSES].map(({ max, windowMs }, i) => {
    const recent = failures.filter((f) => f.at > now - windowMs && (i === 1 || f.ip === ip)).map((f) => f.at);
    if (recent.length < max) return 0;
    // the window opens up again once the oldest guess that still counts falls out of it
    const oldest = recent.sort((a, b) => b - a)[max - 1];
    return oldest + windowMs - now;
  });
  const ms = Math.max(...waits);
  return ms > 0 ? Math.ceil(ms / 60_000) : 0;
}
