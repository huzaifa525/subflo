"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ServiceLogo } from "@/components/ui/service-logo";
import { sym, fmt } from "@/lib/currency-symbols";

interface Analytics {
  totalMonthly: number;
  totalYearly: number;
  currency: string;
  subscriptionCount: number;
  byCategory: { category: string; amount: number; count: number }[];
  upcomingRenewals: {
    id: string;
    serviceName: string;
    amount: number;
    originalAmount: number;
    originalCurrency: string;
    nextRenewal: string;
    daysUntil: number;
  }[];
}

interface Subscription {
  id: string;
  serviceName: string;
  amount: number;
  currency: string;
  billingCycle: string;
  status: string;
  category: string | null;
  nextRenewal: string | null;
  website: string | null;
  logoUrl: string | null;
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [insights, setInsights] = useState<{ type: string; icon: string; message: string; severity: string }[]>([]);
  const [health, setHealth] = useState<{ score: number; grade: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics").then((r) => r.json()),
      fetch("/api/subscriptions").then((r) => r.json()),
      fetch("/api/insights").then((r) => r.json()),
      fetch("/api/health-score").then((r) => r.json()),
    ]).then(([a, s, i, h]) => {
      setAnalytics(a);
      setSubscriptions(s);
      setInsights(i.insights || []);
      setHealth(h);
      setLoading(false);
    });
  }, []);

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

  const cur = analytics?.currency || "INR";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Overview</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Your subscription spending at a glance
          </p>
        </div>
        <Link href="/subscriptions/new" className="sf-btn sf-btn-primary text-xs">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add subscription
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {[
          { label: "Monthly", value: `${sym(cur)}${analytics?.totalMonthly?.toFixed(0) || "0"}`, suffix: "" },
          { label: "Yearly", value: `${sym(cur)}${analytics?.totalYearly?.toFixed(0) || "0"}`, suffix: "" },
          { label: "Active", value: String(analytics?.subscriptionCount || 0), suffix: "subscriptions" },
          { label: "Renewing", value: String(analytics?.upcomingRenewals?.length || 0), suffix: "in 30 days" },
          { label: "Health", value: health ? `${health.grade}` : "—", suffix: health ? `${health.score}/100` : "" },
        ].map((stat) => (
          <div key={stat.label} className="sf-card px-4 py-3.5">
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{stat.label}</p>
            <p className="text-xl font-semibold mt-1 tracking-tight">{stat.value}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{stat.suffix}</p>
          </div>
        ))}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-1.5">
          {insights.slice(0, 4).map((ins, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px]" style={{
              background: ins.severity === "warning" ? "var(--yellow-muted)" : ins.severity === "success" ? "var(--green-muted)" : "var(--accent-muted)",
              color: ins.severity === "warning" ? "var(--yellow)" : ins.severity === "success" ? "var(--green)" : "var(--accent-text)",
            }}>
              <span>{ins.icon}</span>
              <span>{ins.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Subscriptions — 3 cols */}
        <div className="md:col-span-3 sf-card">
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "var(--border-default)" }}>
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Recent subscriptions</span>
            <Link href="/subscriptions" className="text-[11px] font-medium" style={{ color: "var(--accent-text)" }}>View all</Link>
          </div>
          {subscriptions.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No subscriptions yet</p>
              <Link href="/subscriptions/new" className="text-xs mt-1 inline-block" style={{ color: "var(--accent-text)" }}>Add your first one</Link>
            </div>
          ) : (
            <div>
              {subscriptions.slice(0, 8).map((sub, i) => (
                <Link
                  key={sub.id}
                  href={`/subscriptions/${sub.id}`}
                  className="flex items-center justify-between px-4 py-2.5 transition-colors"
                  style={{ borderBottom: i < 7 ? "1px solid var(--border-subtle)" : "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div className="flex items-center gap-3">
                    <ServiceLogo name={sub.serviceName} website={sub.website} logoUrl={sub.logoUrl} size={28} />
                    <div>
                      <p className="text-[13px] font-medium">{sub.serviceName}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{sub.billingCycle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-medium tabular-nums">{fmt(sub.amount, sub.currency)}</span>
                    <span className={`sf-badge ${sub.status === "active" ? "sf-badge-green" : sub.status === "cancelled" ? "sf-badge-red" : "sf-badge-yellow"}`}>
                      {sub.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column — 2 cols */}
        <div className="md:col-span-2 space-y-4">
          {/* Upcoming renewals */}
          <div className="sf-card">
            <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Upcoming renewals</span>
            </div>
            {(!analytics?.upcomingRenewals || analytics.upcomingRenewals.length === 0) ? (
              <div className="px-4 py-8 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>No upcoming renewals</div>
            ) : (
              <div>
                {analytics.upcomingRenewals.slice(0, 5).map((r, i) => (
                  <div key={r.id} className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: i < 4 ? "1px solid var(--border-subtle)" : "none" }}>
                    <div>
                      <p className="text-[13px] font-medium">{r.serviceName}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                        {new Date(r.nextRenewal).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-medium tabular-nums">{fmt(r.amount, cur)}</p>
                      <p className={`text-[11px] ${r.daysUntil <= 3 ? "text-[var(--red)]" : ""}`} style={{ color: r.daysUntil > 3 ? "var(--text-tertiary)" : undefined }}>
                        {r.daysUntil <= 0 ? "Today" : `${r.daysUntil}d left`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Categories */}
          {analytics?.byCategory && analytics.byCategory.length > 0 && (
            <div className="sf-card">
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>By category</span>
              </div>
              <div className="p-3 space-y-1.5">
                {analytics.byCategory.sort((a, b) => b.amount - a.amount).map((cat) => {
                  const maxAmt = Math.max(...analytics.byCategory.map((c) => c.amount), 1);
                  return (
                    <div key={cat.category} className="flex items-center gap-2">
                      <span className="w-16 text-[11px] capitalize truncate" style={{ color: "var(--text-tertiary)" }}>{cat.category}</span>
                      <div className="flex-1 h-5 rounded" style={{ background: "var(--bg-primary)" }}>
                        <div
                          className="h-full rounded flex items-center px-2"
                          style={{ width: `${Math.max((cat.amount / maxAmt) * 100, 8)}%`, background: "var(--accent-muted)" }}
                        >
                          <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: "var(--accent-text)" }}>{fmt(cat.amount, cur)}</span>
                        </div>
                      </div>
                      <span className="text-[10px] w-6 text-right tabular-nums" style={{ color: "var(--text-tertiary)" }}>{cat.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
