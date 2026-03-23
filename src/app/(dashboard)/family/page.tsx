"use client";

import { useEffect, useState } from "react";
import { fmt } from "@/lib/currency-symbols";

interface Member { id: string; name: string; email: string; subscriptionCount: number; monthlyTotal: number; isYou: boolean }

export default function FamilyPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/family").then((r) => r.json()).then((d) => {
      setMembers(d.members || []);
      setTotalMonthly(d.totalMonthly || 0);
      setLoading(false);
    });
  }, []);

  async function invite() {
    setInviting(true); setMsg("");
    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("Member added!");
      setEmail("");
      // Reload
      const r = await fetch("/api/family").then((r) => r.json());
      setMembers(r.members || []);
      setTotalMonthly(r.totalMonthly || 0);
    } else {
      setMsg(data.error || "Failed");
    }
    setInviting(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64" style={{ color: "var(--text-tertiary)" }}><svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8"/></svg></div>;

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Family</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Combined spending across family members</p>
      </div>

      {/* Total */}
      <div className="sf-card p-5 text-center">
        <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Combined monthly spend</p>
        <p className="text-3xl font-semibold mt-1 tabular-nums">{fmt(totalMonthly, "INR")}</p>
        <p className="text-[11px] mt-1" style={{ color: "var(--text-tertiary)" }}>{members.length} member{members.length > 1 ? "s" : ""}</p>
      </div>

      {/* Members */}
      <div className="sf-card">
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Members</span>
        </div>
        {members.map((m) => (
          <div key={m.id} className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium" style={{ background: m.isYou ? "var(--accent-muted)" : "var(--bg-elevated)", color: m.isYou ? "var(--accent-text)" : "var(--text-secondary)" }}>
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[13px] font-medium">{m.name} {m.isYou && <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>(you)</span>}</p>
                <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{m.subscriptionCount} subscriptions</p>
              </div>
            </div>
            <span className="text-[13px] font-medium tabular-nums">{fmt(m.monthlyTotal, "INR")}<span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>/mo</span></span>
          </div>
        ))}
      </div>

      {/* Invite */}
      <div className="sf-card p-4 space-y-3">
        <p className="text-[13px] font-semibold">Add family member</p>
        <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>They need a Subflo account. Enter their email to link.</p>
        <div className="flex gap-2">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="sf-input flex-1" placeholder="member@email.com" />
          <button onClick={invite} disabled={inviting || !email} className="sf-btn sf-btn-primary text-xs">{inviting ? "Adding..." : "Add"}</button>
        </div>
        {msg && <p className="text-[11px]" style={{ color: msg.includes("added") ? "var(--green)" : "var(--red)" }}>{msg}</p>}
      </div>
    </div>
  );
}
