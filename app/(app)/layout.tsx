import Image from "next/image";
import { Suspense } from "react";
import { LevelBar, LevelBarSkeleton } from "@/components/shell/level-bar";
import { BottomNav, BottomNavSkeleton, LogoutButton, Nav, NavSkeleton, NotesButton, SearchButton } from "@/components/shell/nav";
import { SearchShortcut } from "@/components/search/search-box";
import { QuickAddBar, QuickAddSkeleton } from "@/components/tasks/quick-add-bar";
import { OfflineNotice } from "@/components/shell/offline-notice";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <OfflineNotice />
      <SearchShortcut />
      {/* The frame: a rail on wide screens, a strip on top on phones. */}
      <aside className="sticky top-0 z-20 flex shrink-0 flex-col border-b border-rail-line bg-rail text-rail-ink pt-[env(safe-area-inset-top)] md:h-dvh md:w-64 md:border-b-0 md:border-r md:pt-0">
        <div className="flex items-center gap-4 px-4 py-3 md:flex-col md:items-stretch md:gap-8 md:px-5 md:py-7">
          <Image src="/brand/lanes-logo-white.svg" alt="Lanes" width={91} height={28} priority className="hidden md:block" />
          <div className="min-w-0 flex-1 md:flex-none">
            <Suspense fallback={<LevelBarSkeleton />}>
              <LevelBar />
            </Suspense>
          </div>
          <div className="hidden md:block">
            <Suspense fallback={<NavSkeleton />}>
              <Nav />
            </Suspense>
          </div>
          <div className="flex md:hidden">
            <NotesButton />
            <SearchButton />
            <LogoutButton compact />
          </div>
        </div>
        <div className="mt-auto hidden border-t border-rail-line px-5 py-4 md:block">
          <LogoutButton />
        </div>
      </aside>

      <main id="main" className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-10 md:pb-16 md:pt-10 xl:px-14">
        <div className="mx-auto max-w-[1180px]">
          <Suspense fallback={<QuickAddSkeleton />}>
            <QuickAddBar />
          </Suspense>
          {children}
        </div>
      </main>

      <Suspense fallback={<BottomNavSkeleton />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
