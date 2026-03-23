"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ServiceLogo } from "@/components/ui/service-logo";
import { fmt } from "@/lib/currency-symbols";

interface Subscription {
  id: string;
  serviceName: string;
  amount: number;
  currency: string;
  billingCycle: string;
  status: string;
  category: string | null;
  nextRenewal: string | null;
  source: string;
  website: string | null;
  logoUrl: string | null;
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscriptions").then((r) => r.json()).then((d) => { setSubs(d); setLoading(false); });
  }, []);

  const filtered = subs
    .filter((s) => filter === "all" || s.status === filter)
    .filter((s) => s.serviceName.toLowerCase().includes(search.toLowerCase()));

  async function handleDelete(id: string) {
    if (!confirm("Delete this subscription?")) return;
    await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    setSubs(subs.filter((s) => s.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: "var(--text-tertiary)" }}>
        <div className="flex items-center gap-2 text-sm">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8"/></svg>
          Loading
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Subscriptions</h1>
        <Link href="/subscriptions/new" className="sf-btn sf-btn-primary text-xs">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: "var(--text-tertiary)" }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="sf-input pl-8"
          />
        </div>
        <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
          {["all", "active", "paused", "cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-all"
              style={{
                background: filter === f ? "var(--bg-secondary)" : "transparent",
                color: filter === f ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: filter === f ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
              }}
            >{f}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="sf-card px-4 py-16 text-center">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No subscriptions found</p>
        </div>
      ) : (
        <div className="sf-card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[11px] font-medium uppercase tracking-wider border-b" style={{ color: "var(--text-tertiary)", borderColor: "var(--border-default)" }}>
            <span className="col-span-4">Service</span>
            <span className="col-span-2">Plan</span>
            <span className="col-span-2 text-right">Amount</span>
            <span className="col-span-2 text-right">Next renewal</span>
            <span className="col-span-1 text-center">Status</span>
            <span className="col-span-1"></span>
          </div>
          {/* Rows */}
          {filtered.map((sub) => (
            <Link
              key={sub.id}
              href={`/subscriptions/${sub.id}`}
              className="grid grid-cols-12 gap-2 items-center px-4 py-2.5 border-b transition-colors"
              style={{ borderColor: "var(--border-subtle)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div className="col-span-4 flex items-center gap-2.5">
                <ServiceLogo name={sub.serviceName} website={sub.website} logoUrl={sub.logoUrl} size={26} />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium truncate">{sub.serviceName}</p>
                  <p className="text-[11px] capitalize" style={{ color: "var(--text-tertiary)" }}>{sub.category || "other"}</p>
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-[12px] capitalize" style={{ color: "var(--text-secondary)" }}>{sub.billingCycle}</span>
              </div>
              <div className="col-span-2 text-right">
                <span className="text-[13px] font-medium tabular-nums">{fmt(sub.amount, sub.currency)}</span>
              </div>
              <div className="col-span-2 text-right">
                <span className="text-[12px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
                  {sub.nextRenewal ? new Date(sub.nextRenewal).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                </span>
              </div>
              <div className="col-span-1 flex justify-center">
                <span className={`sf-badge ${sub.status === "active" ? "sf-badge-green" : sub.status === "cancelled" ? "sf-badge-red" : "sf-badge-yellow"}`}>
                  {sub.status}
                </span>
              </div>
              <div className="col-span-1 flex justify-end gap-0.5">
                {sub.status === "active" && (
                  <button
                    onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await fetch(`/api/subscriptions/${sub.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paused" }) }); setSubs(subs.map((s) => s.id === sub.id ? { ...s, status: "paused" } : s)); }}
                    className="sf-btn sf-btn-ghost p-1"
                    style={{ color: "var(--text-tertiary)" }}
                    title="Pause"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="3" height="10" rx="1" fill="currentColor"/><rect x="10" y="3" width="3" height="10" rx="1" fill="currentColor"/></svg>
                  </button>
                )}
                {sub.status === "paused" && (
                  <button
                    onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await fetch(`/api/subscriptions/${sub.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "active" }) }); setSubs(subs.map((s) => s.id === sub.id ? { ...s, status: "active" } : s)); }}
                    className="sf-btn sf-btn-ghost p-1"
                    style={{ color: "var(--green)" }}
                    title="Resume"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 3l9 5-9 5V3z" fill="currentColor"/></svg>
                  </button>
                )}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(sub.id); }}
                  className="sf-btn sf-btn-ghost p-1"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
                  title="Delete"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
