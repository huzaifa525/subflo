"use client";

import { useEffect, useState } from "react";
import { sym, fmt } from "@/lib/currency-symbols";

interface Analytics {
  totalMonthly: number;
  totalYearly: number;
  currency: string;
  subscriptionCount: number;
  byCategory: { category: string; amount: number; count: number }[];
  byMonth: { month: string; amount: number }[];
  upcomingRenewals: { id: string; serviceName: string; amount: number; daysUntil: number }[];
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CAT_COLORS: Record<string, string> = {
  entertainment: "#e5484d", music: "#e93d82", productivity: "#3b82f6",
  developer: "#635bff", cloud: "#3ecf8e", shopping: "#f5a623",
  telecom: "#00a2c7", health: "#30a46c", education: "#6e56cf",
  finance: "#f76b15", other: "#6e6e80",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics").then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64" style={{ color: "var(--text-tertiary)" }}>
      <div className="flex items-center gap-2 text-sm">
        <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8"/></svg>
        Loading
      </div>
    </div>
  );

  if (!data) return null;
  const cur = data.currency || "INR";
  const maxCat = Math.max(...data.byCategory.map((c) => c.amount), 1);
  const maxMonth = Math.max(...(data.byMonth.length ? data.byMonth.map((m) => m.amount) : [1]));
  const totalCatCount = data.byCategory.reduce((a, c) => a + c.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Analytics</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Spending breakdown and trends</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Monthly spend", value: `${sym(cur)}${data.totalMonthly.toFixed(0)}`, sub: "per month" },
          { label: "Yearly projection", value: `${sym(cur)}${data.totalYearly.toFixed(0)}`, sub: "per year" },
          { label: "Daily average", value: `${sym(cur)}${(data.totalMonthly / 30).toFixed(0)}`, sub: "per day" },
        ].map((s) => (
          <div key={s.label} className="sf-card px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{s.label}</p>
            <p className="text-2xl font-semibold mt-1.5 tracking-tight tabular-nums">{s.value}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Monthly trend — 3 cols */}
        <div className="md:col-span-3 sf-card">
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Monthly spending</span>
          </div>
          {data.byMonth.length === 0 ? (
            <div className="px-4 py-16 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
              No payment data yet. Add subscriptions to see trends.
            </div>
          ) : (
            <div className="p-4">
              {/* Y-axis labels + bars */}
              <div className="flex items-end gap-1.5" style={{ height: 200 }}>
                {data.byMonth.map((m) => {
                  const pct = (m.amount / maxMonth) * 100;
                  const [, month] = m.month.split("-");
                  const monthName = MONTH_NAMES[parseInt(month) - 1] || month;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center justify-end gap-1 group">
                      <span className="text-[10px] tabular-nums opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-secondary)" }}>
                        {fmt(m.amount, cur)}
                      </span>
                      <div
                        className="w-full rounded-sm transition-all group-hover:opacity-80"
                        style={{ height: `${Math.max(pct, 2)}%`, background: "var(--accent)", borderRadius: "3px 3px 0 0" }}
                      />
                      <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{monthName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Category breakdown — 2 cols */}
        <div className="md:col-span-2 sf-card">
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>By category</span>
          </div>
          {data.byCategory.length === 0 ? (
            <div className="px-4 py-16 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>Add subscriptions with categories to see breakdown</div>
          ) : (
            <div className="p-4 space-y-3">
              {/* Donut-style summary */}
              <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {(() => {
                      let offset = 0;
                      return data.byCategory.sort((a, b) => b.amount - a.amount).map((cat) => {
                        const pct = totalCatCount > 0 ? (cat.count / totalCatCount) * 100 : 0;
                        const dash = pct * 0.754; // circumference factor for r=12
                        const el = (
                          <circle
                            key={cat.category}
                            cx="18" cy="18" r="12"
                            fill="none"
                            stroke={CAT_COLORS[cat.category] || CAT_COLORS.other}
                            strokeWidth="5"
                            strokeDasharray={`${dash} ${75.4 - dash}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                          />
                        );
                        offset += dash;
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-semibold">{data.subscriptionCount}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold tabular-nums">{fmt(data.totalMonthly, cur)}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    {data.byCategory.length} categories
                  </p>
                </div>
              </div>

              {/* Category list */}
              {data.byCategory.sort((a, b) => b.amount - a.amount).map((cat) => (
                <div key={cat.category} className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CAT_COLORS[cat.category] || CAT_COLORS.other }} />
                  <span className="text-[12px] capitalize flex-1 truncate" style={{ color: "var(--text-secondary)" }}>{cat.category}</span>
                  <span className="text-[12px] font-medium tabular-nums">{fmt(cat.amount, cur)}</span>
                  <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-primary)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(cat.amount / maxCat) * 100}%`, background: CAT_COLORS[cat.category] || CAT_COLORS.other }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
