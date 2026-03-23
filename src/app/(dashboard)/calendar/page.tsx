"use client";

import { useEffect, useState } from "react";
import { fmt } from "@/lib/currency-symbols";

interface Sub {
  id: string; serviceName: string; amount: number; currency: string; nextRenewal: string | null; status: string;
}

export default function CalendarPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetch("/api/subscriptions").then((r) => r.json()).then((d) => { setSubs(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64" style={{ color: "var(--text-tertiary)" }}><svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8"/></svg></div>;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = new Date(year, month).toLocaleString("en", { month: "long", year: "numeric" });

  // Map renewals to days
  const renewalMap = new Map<number, Sub[]>();
  for (const s of subs) {
    if (!s.nextRenewal || s.status !== "active") continue;
    const d = new Date(s.nextRenewal);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      renewalMap.set(day, [...(renewalMap.get(day) || []), s]);
    }
  }

  const prev = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Calendar</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Renewal dates at a glance</p>
      </div>

      <div className="sf-card p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="sf-btn sf-btn-ghost p-1.5"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          <span className="text-sm font-semibold">{monthName}</span>
          <button onClick={next} className="sf-btn sf-btn-ghost p-1.5"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
            <div key={d} className="text-center text-[10px] font-medium py-1" style={{ color: "var(--text-tertiary)" }}>{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const renewals = renewalMap.get(day) || [];
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            return (
              <div key={day} className="relative rounded-md p-1 min-h-[60px]" style={{
                background: renewals.length > 0 ? "var(--accent-muted)" : "transparent",
                border: isToday ? "1px solid var(--accent)" : "1px solid transparent",
              }}>
                <span className="text-[11px] font-medium" style={{ color: isToday ? "var(--accent)" : "var(--text-secondary)" }}>{day}</span>
                {renewals.map((s) => (
                  <div key={s.id} className="mt-0.5 px-1 py-0.5 rounded text-[9px] font-medium truncate" style={{ background: "var(--accent)", color: "#fff" }}>
                    {s.serviceName} {fmt(s.amount, s.currency)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
