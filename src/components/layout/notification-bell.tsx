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
  const [permission, setPermission] = useState<string>("default");

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then((d) => setNotifications(d.notifications || []));
    if ("Notification" in window) setPermission(Notification.permission);
    const interval = setInterval(() => {
      fetch("/api/notifications").then((r) => r.json()).then((d) => setNotifications(d.notifications || []));
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (notifications.length > 0 && "Notification" in window && Notification.permission === "granted") {
      const n = notifications[0];
      new Notification(`${n.serviceName} renewing ${n.daysUntil <= 0 ? "today" : `in ${n.daysUntil}d`}`, {
        body: `${fmt(n.amount, n.currency)}${notifications.length > 1 ? ` + ${notifications.length - 1} more` : ""}`,
        icon: "/icons/icon-192.png",
      });
    }
  }, [notifications]);

  function requestPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((p) => setPermission(p));
    }
  }

  const count = notifications.length;
  const urgent = notifications.filter((n) => n.daysUntil <= 1).length;

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); requestPermission(); }}
        className="relative p-1.5 rounded-md transition-colors"
        style={{ color: count > 0 ? "var(--yellow)" : "var(--text-tertiary)" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M4 6a4 4 0 018 0v3l1.5 2H2.5L4 9V6z" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M6 12a2 2 0 004 0" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full text-[8px] font-bold flex items-center justify-center px-0.5" style={{ background: urgent > 0 ? "var(--red)" : "var(--yellow)", color: urgent > 0 ? "#fff" : "var(--text-inverse)" }}>
            {count}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop on mobile */}
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)} />

          <div className="fixed bottom-20 left-4 right-4 sm:absolute sm:bottom-full sm:left-0 sm:right-auto sm:w-72 sm:mb-2 sf-card shadow-2xl z-50 overflow-hidden" style={{ maxHeight: 360 }}>
            {/* Header */}
            <div className="px-3.5 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-default)" }}>
              <span className="text-[12px] font-semibold">Notifications</span>
              {permission !== "granted" && (
                <button onClick={requestPermission} className="text-[10px] font-medium" style={{ color: "var(--accent-text)" }}>Enable alerts</button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: 290 }}>
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <svg width="24" height="24" viewBox="0 0 16 16" fill="none" className="mx-auto mb-2" style={{ color: "var(--text-tertiary)" }}>
                    <path d="M4 6a4 4 0 018 0v3l1.5 2H2.5L4 9V6z" stroke="currentColor" strokeWidth="1"/>
                    <path d="M6 12a2 2 0 004 0" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                  <p className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>All clear</p>
                  <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>No upcoming renewals</p>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <Link
                    key={n.id}
                    href={`/subscriptions/${n.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 transition-colors"
                    style={{ borderBottom: i < notifications.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: n.daysUntil <= 1 ? "var(--red)" : n.daysUntil <= 3 ? "var(--yellow)" : "var(--accent)" }} />
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium truncate">{n.serviceName}</p>
                        <p className="text-[10px]" style={{ color: n.daysUntil <= 1 ? "var(--red)" : "var(--text-tertiary)" }}>
                          {n.daysUntil <= 0 ? "Renews today!" : n.daysUntil === 1 ? "Renews tomorrow" : `Renews in ${n.daysUntil} days`}
                          {" · "}{new Date(n.nextRenewal).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                    </div>
                    <span className="text-[12px] font-semibold tabular-nums shrink-0 ml-2">{fmt(n.amount, n.currency)}</span>
                  </Link>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-3.5 py-2 text-center" style={{ borderTop: "1px solid var(--border-default)" }}>
                <Link href="/calendar" onClick={() => setOpen(false)} className="text-[11px] font-medium" style={{ color: "var(--accent-text)" }}>View calendar</Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
