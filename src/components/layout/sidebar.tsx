"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { SearchBar } from "./search-bar";
import { NotificationBell } from "./notification-bell";

const nav = [
  { href: "/dashboard", label: "Overview", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 3a2 2 0 012-2h4v6H1V3zM9 1h4a2 2 0 012 2v2H9V1zM9 7h6v4a2 2 0 01-2 2H9V7zM1 9h6v6H3a2 2 0 01-2-2V9z" fill="currentColor" opacity=".7"/></svg> },
  { href: "/subscriptions", label: "Subscriptions", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1 6h14" stroke="currentColor" strokeWidth="1.5"/></svg> },
  { href: "/analytics", label: "Analytics", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 13V8M7 13V5M11 13V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { href: "/calendar", label: "Calendar", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1 7h14M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { href: "/inbox", label: "Inbox", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 4l7 5 7-5M1 4v8a2 2 0 002 2h10a2 2 0 002-2V4M1 4a2 2 0 012-2h10a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5"/></svg> },
  { href: "/import", label: "Import", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M8 10l-3-3M8 10l3-3M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { href: "/family", label: "Family", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="11" cy="6" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1 14c0-2.5 2-4.5 5-4.5s5 2 5 4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M11 9.5c2 0 4 1.5 4 3.5" stroke="currentColor" strokeWidth="1.3"/></svg> },
  { href: "/settings", label: "Settings", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6.7 1.6a1 1 0 011.6 0l.6.8a1 1 0 00.9.4l1-.1a1 1 0 01.8 1.4l-.4.9a1 1 0 00.1.9l.6.8a1 1 0 01-.5 1.5l-1 .3a1 1 0 00-.7.7l-.2 1a1 1 0 01-1.5.5l-.8-.5a1 1 0 00-1 0l-.7.5a1 1 0 01-1.5-.5l-.3-1a1 1 0 00-.6-.7l-1-.3a1 1 0 01-.5-1.5l.5-.8a1 1 0 000-.9l-.4-1a1 1 0 01.8-1.3l1 .1a1 1 0 00.9-.4l.5-.9z" stroke="currentColor" strokeWidth="1.2"/></svg> },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r flex flex-col" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}>
      {/* Logo */}
      <div className="px-4 h-14 flex items-center gap-2.5 border-b" style={{ borderColor: "var(--border-default)" }}>
        <div className="w-6 h-6 rounded-md flex items-center justify-center text-white font-semibold text-xs" style={{ background: "var(--accent)" }}>S</div>
        <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Subflo</span>
      </div>

      {/* Search */}
      <div className="px-2 py-2">
        <SearchBar />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-1 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] transition-all"
              style={{
                background: active ? "var(--accent-muted)" : "transparent",
                color: active ? "var(--accent-text)" : "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
              {session?.user?.name?.charAt(0)?.toUpperCase() || session?.user?.email?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
              {session?.user?.email || ""}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2 px-2.5 py-[6px] rounded-md text-xs transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red-muted)"; e.currentTarget.style.color = "var(--red)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M6 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
