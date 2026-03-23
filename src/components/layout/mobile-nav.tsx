"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const tabs = [
  { href: "/dashboard", label: "Home", icon: <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M1 3a2 2 0 012-2h4v6H1V3zM9 1h4a2 2 0 012 2v2H9V1zM9 7h6v4a2 2 0 01-2 2H9V7zM1 9h6v6H3a2 2 0 01-2-2V9z" fill="currentColor" opacity=".7"/></svg> },
  { href: "/subscriptions", label: "Subs", icon: <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1 6h14" stroke="currentColor" strokeWidth="1.5"/></svg> },
  { href: "/subscriptions/new", label: "Add", icon: <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { href: "/analytics", label: "Stats", icon: <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M3 13V8M7 13V5M11 13V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
];

const moreLinks = [
  { href: "/calendar", label: "Calendar" },
  { href: "/inbox", label: "Inbox" },
  { href: "/import", label: "Import" },
  { href: "/family", label: "Family" },
  { href: "/settings", label: "Settings" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = ["/calendar", "/inbox", "/import", "/family", "/settings"].some((p) => pathname.startsWith(p));

  return (
    <>
      {/* More popup */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden" style={{ background: "rgba(0,0,0,0.3)" }} onClick={() => setMoreOpen(false)}>
          <div className="absolute bottom-16 right-2 sf-card shadow-2xl py-2 w-44" onClick={(e) => e.stopPropagation()}>
            {moreLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMoreOpen(false)}
                className="block px-4 py-2.5 text-[13px] font-medium transition-colors"
                style={{
                  color: pathname.startsWith(l.href) ? "var(--accent)" : "var(--text-secondary)",
                  background: pathname.startsWith(l.href) ? "var(--accent-muted)" : "transparent",
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t pb-[env(safe-area-inset-bottom)]" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}>
        <div className="flex items-center justify-around py-2">
          {tabs.map((t) => {
            const active = t.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} className="flex flex-col items-center gap-0.5 px-4 py-1 min-w-[48px]" style={{ color: active ? "var(--accent)" : "var(--text-tertiary)" }}>
                {t.icon}
                <span className="text-[10px] font-medium">{t.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex flex-col items-center gap-0.5 px-4 py-1 min-w-[48px]"
            style={{ color: moreOpen || isMoreActive ? "var(--accent)" : "var(--text-tertiary)" }}
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="4" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/></svg>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
