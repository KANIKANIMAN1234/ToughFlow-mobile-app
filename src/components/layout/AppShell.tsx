"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FileText,
  Home,
  MapPin,
  Menu,
  Receipt,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDisplayMode } from "@/contexts/DisplayModeContext";
import { DisplayModeToggle } from "@/components/layout/DisplayModeToggle";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/home", label: "ホーム", icon: Home },
  { href: "/expenses/new", label: "立替精算", icon: Receipt },
  { href: "/daily-reports/new", label: "作業日報", icon: FileText },
  { href: "/site-surveys/new", label: "現地調査", icon: MapPin },
  { href: "/projects", label: "案件", icon: ClipboardList },
];

function NavLinks({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <>
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium",
              active
                ? "bg-brand-50 text-brand-700"
                : "text-slate-700 hover:bg-slate-50",
              className
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </>
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
  const [open, setOpen] = useState(false);

  if (isTablet) {
    return (
      <div className="flex min-h-screen w-full bg-surface">
        <aside className="flex w-60 shrink-0 flex-col border-r border-surface-border bg-white">
          <div className="flex h-14 items-center border-b px-4">
            <span className="font-bold text-brand-700">ToughFlow</span>
          </div>
          <nav className="flex-1 p-3">
            <NavLinks pathname={pathname} />
          </nav>
          <div className="border-t p-4 text-xs text-slate-500">
            {user?.tenantName}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-surface-border bg-white px-6">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-brand-600">ToughFlow</p>
              <h1 className="truncate text-sm font-bold text-slate-900">
                {title}
              </h1>
            </div>
            <DisplayModeToggle />
            <button
              type="button"
              onClick={() => logout()}
              className="truncate text-xs text-slate-500"
            >
              {user?.name}
            </button>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-mobile bg-surface">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-surface-border bg-white px-3">
        <button
          type="button"
          aria-label="メニュー"
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-brand-600">ToughFlow</p>
          <h1 className="truncate text-sm font-bold text-slate-900">{title}</h1>
        </div>
        <DisplayModeToggle compact />
        <button
          type="button"
          onClick={() => logout()}
          className="max-w-[4.5rem] truncate text-xs text-slate-500"
        >
          {user?.name}
        </button>
      </header>

      {open && (
        <button
          type="button"
          aria-label="閉じる"
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-white shadow-xl transition-transform",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="font-bold text-brand-700">ToughFlow</span>
          <button type="button" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 p-3">
          <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
        </nav>
        <div className="border-t p-4 text-xs text-slate-500">
          {user?.tenantName}
        </div>
      </aside>

      <main className="px-4 py-4 pb-24">{children}</main>
    </div>
  );
}
