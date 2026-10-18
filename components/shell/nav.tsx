import { getWorkspaces } from "@/lib/data/shell";
import { colorVar } from "@/lib/domain/palette";
import { logout } from "@/lib/auth/actions";
import Link from "next/link";
import { NavLink, PlainNavLink } from "./nav-link";

const HOME = "var(--queen)";
const DASH = "var(--ink)";
const TOOL = "var(--rail-muted)";

/** Short labels for the phone's bottom bar, where six items share 390px. */
const shortName = (name: string) => name.split(/\s+&|\s/)[0];

export async function Nav() {
  const workspaces = await getWorkspaces();
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      <NavLink href="/" color={HOME}>
        Today
      </NavLink>
      <NavLink href="/dashboard" color={DASH}>
        Dashboard
      </NavLink>
      <p className="mb-1 mt-5 px-3 text-xs font-semibold text-rail-muted">Workspaces</p>
      {workspaces.map((w) => (
        <NavLink key={w.id} href={`/w/${w.slug}`} color={colorVar(w.color)}>
          {w.name}
        </NavLink>
      ))}
      <p className="mb-1 mt-5 px-3 text-xs font-semibold text-rail-muted">Tools</p>
      <NavLink href="/search" color={TOOL}>
        Search
      </NavLink>
      <NavLink href="/notes" color={TOOL}>
        Notes
      </NavLink>
      <NavLink href="/templates" color={TOOL}>
        Templates
      </NavLink>
      <NavLink href="/routines" color={TOOL}>
        Routines
      </NavLink>
      <NavLink href="/subscriptions" color={TOOL}>
        Subscriptions
      </NavLink>
      <NavLink href="/data" color={TOOL}>
        Import &amp; export
      </NavLink>
    </nav>
  );
}

export function NavSkeleton() {
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      <PlainNavLink href="/" color={HOME}>
        Today
      </PlainNavLink>
      <PlainNavLink href="/dashboard" color={DASH}>
        Dashboard
      </PlainNavLink>
    </nav>
  );
}

const bottomCls =
  "fixed inset-x-0 bottom-0 z-30 flex border-t border-rail-line bg-rail pb-[env(safe-area-inset-bottom)] md:hidden";

export async function BottomNav() {
  const workspaces = await getWorkspaces();
  return (
    <nav aria-label="Main" className={bottomCls}>
      <NavLink href="/" color={HOME} variant="bottom">
        Today
      </NavLink>
      <NavLink href="/dashboard" color={DASH} variant="bottom">
        Stats
      </NavLink>
      {workspaces.map((w) => (
        <NavLink key={w.id} href={`/w/${w.slug}`} color={colorVar(w.color)} variant="bottom">
          {shortName(w.name)}
        </NavLink>
      ))}
    </nav>
  );
}

export function BottomNavSkeleton() {
  return (
    <nav aria-label="Main" className={bottomCls}>
      <PlainNavLink href="/" color={HOME} variant="bottom">
        Today
      </PlainNavLink>
      <PlainNavLink href="/dashboard" color={DASH} variant="bottom">
        Stats
      </PlainNavLink>
    </nav>
  );
}

/** The phone's top strip has room for one more control: search. */
export function SearchButton() {
  return (
    <Link href="/search" aria-label="Search" className="grid size-10 place-items-center rounded-lg text-rail-muted hover:bg-rail-hover hover:text-rail-ink">
      <svg aria-hidden viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="3.5" width="9" height="9" />
        <path d="m12.5 12.5 4 4" />
      </svg>
    </Link>
  );
}

/** Notes on phones, where the tools in the rail don't fit the bottom bar. */
export function NotesButton() {
  return (
    <Link href="/notes" aria-label="Notes" className="grid size-10 place-items-center rounded-lg text-rail-muted hover:bg-rail-hover hover:text-rail-ink">
      <svg aria-hidden viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="12" height="14" />
        <path d="M7 7h6M7 10h6M7 13h3" />
      </svg>
    </Link>
  );
}

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={logout}>
      {compact ? (
        <button
          aria-label="Sign out"
          className="grid size-10 place-items-center rounded-lg text-rail-muted hover:bg-rail-hover hover:text-rail-ink"
        >
          <svg aria-hidden viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3.5H5A1.5 1.5 0 0 0 3.5 5v10A1.5 1.5 0 0 0 5 16.5h3" />
            <path d="M12.5 6.5 16 10l-3.5 3.5M16 10H8" />
          </svg>
        </button>
      ) : (
        <button className="rounded-lg px-3 py-2 text-sm text-rail-muted hover:bg-rail-hover hover:text-rail-ink">Sign out</button>
      )}
    </form>
  );
}
