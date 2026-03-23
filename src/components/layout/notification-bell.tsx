"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fmt } from "@/lib/currency-symbols";

interface Notification {
  id: string; serviceName: string; amount: number; currency: string; nextRenewal: string; daysUntil: number;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then((d) => setNotifications(d.notifications || []));
    // Check every 30 minutes
    const interval = setInterval(() => {
      fetch("/api/notifications").then((r) => r.json()).then((d) => setNotifications(d.notifications || []));
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Browser notification on first load
  useEffect(() => {
    if (notifications.length > 0 && "Notification" in window && Notification.permission === "granted") {
      const n = notifications[0];
      new Notification(`${n.serviceName} renewing ${n.daysUntil <= 0 ? "today" : `in ${n.daysUntil} day${n.daysUntil > 1 ? "s" : ""}`}`, {
        body: `${fmt(n.amount, n.currency)}/${notifications.length > 1 ? ` and ${notifications.length - 1} more` : ""}`,
        icon: "/icons/icon-192.png",
      });
    }
  }, [notifications]);

  function requestPermission() {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }

  const count = notifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) requestPermission(); }}
        className="sf-btn sf-btn-ghost p-1.5 relative"
        title="Notifications"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: count > 0 ? "var(--yellow)" : "var(--text-tertiary)" }}>
          <path d="M4 6a4 4 0 018 0v3l1.5 2H2.5L4 9V6z" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M6 12a2 2 0 004 0" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center" style={{ background: "var(--red)", color: "#fff" }}>
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-64 sf-card shadow-xl z-50" style={{ maxHeight: 300, overflow: "auto" }}>
          <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border-default)" }}>
            <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>Upcoming renewals</span>
          </div>
          {notifications.length === 0 ? (
            <div className="px-3 py-4 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>No upcoming renewals</div>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={`/subscriptions/${n.id}`}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-3 py-2 transition-colors"
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div>
                  <p className="text-[12px] font-medium">{n.serviceName}</p>
                  <p className="text-[10px]" style={{ color: n.daysUntil <= 1 ? "var(--red)" : "var(--text-tertiary)" }}>
                    {n.daysUntil <= 0 ? "Today!" : `in ${n.daysUntil} day${n.daysUntil > 1 ? "s" : ""}`}
                  </p>
                </div>
                <span className="text-[11px] font-medium tabular-nums">{fmt(n.amount, n.currency)}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
