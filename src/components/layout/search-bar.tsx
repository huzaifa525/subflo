"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ServiceLogo } from "@/components/ui/service-logo";
import { fmt } from "@/lib/currency-symbols";

interface Sub {
  id: string; serviceName: string; amount: number; currency: string; status: string; category: string | null; website: string | null;
}

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [subs, setSubs] = useState<Sub[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && subs.length === 0) {
      fetch("/api/subscriptions").then((r) => r.json()).then(setSubs);
    }
  }, [open, subs.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = subs.filter((s) =>
    s.serviceName.toLowerCase().includes(query.toLowerCase()) ||
    (s.category || "").toLowerCase().includes(query.toLowerCase())
  );

  if (!open) return (
    <button onClick={() => setOpen(true)} className="sf-btn sf-btn-ghost text-[11px] gap-1.5 w-full justify-start" style={{ color: "var(--text-tertiary)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      Search... <span className="ml-auto text-[9px] px-1 py-0.5 rounded" style={{ background: "var(--bg-tertiary)" }}>⌘K</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div ref={ref} className="sf-card w-full max-w-md shadow-2xl" style={{ maxHeight: "60vh" }}>
        <div className="p-3 border-b" style={{ borderColor: "var(--border-default)" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subscriptions..."
            className="sf-input"
            autoFocus
          />
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "40vh" }}>
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
              {query ? "No results" : "Type to search"}
            </div>
          ) : (
            filtered.map((s) => (
              <Link
                key={s.id}
                href={`/subscriptions/${s.id}`}
                onClick={() => { setOpen(false); setQuery(""); }}
                className="flex items-center justify-between px-4 py-2.5 transition-colors"
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div className="flex items-center gap-2.5">
                  <ServiceLogo name={s.serviceName} website={s.website} size={22} />
                  <div>
                    <p className="text-[13px] font-medium">{s.serviceName}</p>
                    <p className="text-[10px] capitalize" style={{ color: "var(--text-tertiary)" }}>{s.category || "other"} &middot; {s.status}</p>
                  </div>
                </div>
                <span className="text-[12px] font-medium tabular-nums">{fmt(s.amount, s.currency)}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
