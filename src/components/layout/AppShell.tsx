"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useDisplayMode } from "@/contexts/DisplayModeContext";
import { DisplayModeToggle } from "@/components/layout/DisplayModeToggle";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { filterNavByAccess, MOBILE_NAV_ITEMS } from "@/lib/permissions/nav";

function NavTabs({
  pathname,
  items,
}: {
  pathname: string;
  items: typeof MOBILE_NAV_ITEMS;
}) {
  return (
    <nav
      aria-label="メインメニュー"
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-surface-border bg-white px-3"
    >
      {items.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center border-b-2 px-3 py-2.5 text-nav-link font-normal transition-colors",
              active
                ? "border-brand-600 text-apple-text"
                : "border-transparent text-apple-glyph hover:text-apple-text"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isTablet } = useDisplayMode();
  const { accessMap, loading: permLoading } = usePermissions();

  const visibleNav = permLoading
    ? MOBILE_NAV_ITEMS.filter((item) => item.href === "/home")
    : filterNavByAccess(MOBILE_NAV_ITEMS, accessMap);

  if (isTablet) {
    return (
      <div className="flex min-h-dvh flex-col bg-surface">
        <header className="glass-nav sticky top-0 z-30 flex h-11 shrink-0 items-center gap-3 px-6">
          <div className="min-w-0 flex-1">
            <p className="text-nav-link font-normal text-apple-glyph">ToughFlow</p>
            <h1 className="apple-heading truncate text-caption">{title}</h1>
          </div>
          <DisplayModeToggle />
          <button
            type="button"
            onClick={() => logout()}
            className="max-w-[5rem] truncate text-nav-link text-apple-glyph"
          >
            {user?.name}
          </button>
        </header>

        <NavTabs pathname={pathname} items={visibleNav} />

        <main className="flex min-h-0 flex-1 flex-col px-6 py-5">{children}</main>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh flex-col max-w-mobile bg-surface">
      <header className="glass-nav sticky top-0 z-30 flex h-11 shrink-0 items-center gap-2 px-3">
        <div className="min-w-0 flex-1">
          <p className="text-nav-link font-normal text-apple-glyph">ToughFlow</p>
          <h1 className="apple-heading truncate text-caption">{title}</h1>
        </div>
        <DisplayModeToggle compact />
        <button
          type="button"
          onClick={() => logout()}
          className="max-w-[4.5rem] truncate text-nav-link text-apple-glyph"
        >
          {user?.name}
        </button>
      </header>

      <NavTabs pathname={pathname} items={visibleNav} />

      <main className="flex min-h-0 flex-1 flex-col px-4 py-5">{children}</main>
    </div>
  );
}
