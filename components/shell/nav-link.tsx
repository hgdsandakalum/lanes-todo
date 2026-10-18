"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = { href: string; color: string; children: React.ReactNode; variant?: "rail" | "bottom" };

const cls = {
  rail: "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-rail-muted transition-colors hover:bg-rail-hover hover:text-rail-ink aria-[current=page]:bg-rail-hover aria-[current=page]:text-rail-ink",
  bottom:
    "group flex min-w-0 flex-1 flex-col items-center gap-1.5 px-1 pb-1.5 pt-2.5 text-[11px] font-medium text-rail-muted aria-[current=page]:text-rail-ink",
};

/** A dot, like the logo's: a ring in the item's colour, filled when its route is open. */
function Coin({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="size-3 shrink-0 rounded-full border-2 transition-colors group-aria-[current=page]:bg-[var(--coin)]"
      style={{ borderColor: color, ["--coin" as string]: color }}
    />
  );
}

function Inner({ href, color, children, active, variant = "rail" }: Props & { active: boolean }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cls[variant]}>
      <Coin color={color} />
      <span className="max-w-full truncate">{children}</span>
    </Link>
  );
}

/** Highlights itself when its route is open. Must render inside <Suspense> (it reads the URL). */
export function NavLink(props: Props) {
  const path = usePathname();
  const active = props.href === "/" ? path === "/" : path === props.href || path.startsWith(props.href + "/");
  return <Inner {...props} active={active} />;
}

/** Same look, no URL read: used in the static shell before the nav streams in. */
export function PlainNavLink(props: Props) {
  return <Inner {...props} active={false} />;
}
