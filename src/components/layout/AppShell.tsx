"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDisplayMode } from "@/contexts/DisplayModeContext";
import { DisplayModeToggle } from "@/components/layout/DisplayModeToggle";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { filterNavByAccess, MOBILE_NAV_ITEMS } from "@/lib/permissions/nav";
import { useState } from "react";

function NavLinks({
  pathname,
  onNavigate,
  className,
  items,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
  items: typeof MOBILE_NAV_ITEMS;
}) {
  return (
    <>
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-body font-normal transition-colors",
              active
                ? "bg-apple-section text-apple-text"
                : "text-apple-text hover:bg-apple-section/70",
              className
            )}
          >
            <Icon className="h-5 w-5 shrink-0 text-apple-glyph" />
            {label}
          </Link>
        );
      })}
    </>
  );
}

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
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-surface-border bg-white px-4"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-nav-link font-normal transition-colors",
              active
                ? "border-brand-600 text-apple-text"
                : "border-transparent text-apple-glyph hover:text-apple-text"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
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
  const [open, setOpen] = useState(false);

  const visibleNav = permLoading
    ? MOBILE_NAV_ITEMS.filter((item) => item.href === "/home")
    : filterNavByAccess(MOBILE_NAV_ITEMS, accessMap);

  if (isTablet) {
    return (
      <div className="flex min-h-screen flex-col bg-surface">
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

        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-mobile bg-surface">
      <header className="glass-nav sticky top-0 z-30 flex h-11 items-center gap-2 px-3">
        <button
          type="button"
          aria-label="メニュー"
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-apple-text hover:bg-apple-section focus-apple"
        >
          <Menu className="h-5 w-5" />
        </button>
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

      {open && (
        <button
          type="button"
          aria-label="閉じる"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-[#fafafc] shadow-apple transition-transform",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-11 items-center justify-between border-b border-surface-border px-4">
          <span className="apple-heading text-body">ToughFlow</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-apple-text hover:bg-apple-section focus-apple"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 p-3">
          <NavLinks
            pathname={pathname}
            onNavigate={() => setOpen(false)}
            items={visibleNav}
          />
        </nav>
        <div className="border-t border-surface-border p-4 text-nav-link text-apple-glyph">
          {user?.tenantName}
        </div>
      </aside>

      <main className="px-4 py-5 pb-24">{children}</main>
    </div>
  );
}
