"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fmt } from "@/lib/currency-symbols";

export default function EditSubscriptionPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    serviceName: "", planName: "", amount: "", currency: "INR", billingCycle: "monthly",
    nextRenewal: "", category: "", paymentMethod: "", sharedWith: "", website: "", notes: "",
    autoRenew: true,
  });

  useEffect(() => {
    fetch(`/api/subscriptions/${params.id}`).then((r) => r.json()).then((d) => {
      if (d.error) { router.push("/subscriptions"); return; }
      setForm({
        serviceName: d.serviceName || "",
        planName: d.planName || "",
        amount: String(d.amount || ""),
        currency: d.currency || "INR",
        billingCycle: d.billingCycle || "monthly",
        nextRenewal: d.nextRenewal ? d.nextRenewal.split("T")[0] : "",
        category: d.category || "",
        paymentMethod: d.paymentMethod || "",
        sharedWith: d.sharedWith || "",
        website: d.website || "",
        notes: d.notes || "",
        autoRenew: d.autoRenew ?? true,
      });
      setLoading(false);
    });
  }, [params.id, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/subscriptions/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) || 0 }),
    });
    if (res.ok) router.push(`/subscriptions/${params.id}`);
    else setSaving(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64" style={{ color: "var(--text-tertiary)" }}>
      <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8"/></svg>
    </div>
  );

  return (
    <div className="max-w-xl">
      <button onClick={() => router.back()} className="sf-btn sf-btn-ghost text-xs -ml-2 mb-4" style={{ color: "var(--text-tertiary)" }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back
      </button>
      <h1 className="text-lg font-semibold tracking-tight mb-1">Edit subscription</h1>
      <p className="text-xs mb-5" style={{ color: "var(--text-tertiary)" }}>{form.serviceName} &middot; {fmt(parseFloat(form.amount) || 0, form.currency)}/{form.billingCycle}</p>

      <form onSubmit={handleSave} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Service name</label>
            <input type="text" value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} className="sf-input" required />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Plan name</label>
            <input type="text" value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} className="sf-input" placeholder="e.g. Premium" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Amount</label>
            <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="sf-input" required />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Currency</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="sf-input">
              {["INR","USD","EUR","GBP","AED","CAD","AUD","JPY"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Cycle</label>
            <select value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })} className="sf-input">
              <option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="quarterly">Quarterly</option><option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Next renewal</label>
            <input type="date" value={form.nextRenewal} onChange={(e) => setForm({ ...form, nextRenewal: e.target.value })} className="sf-input" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="sf-input">
              <option value="">Select</option>
              {["entertainment","music","productivity","developer","cloud","health","education","shopping","telecom","finance","other"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Payment method</label>
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="sf-input">
              <option value="">Select</option>
              <option value="credit_card">Credit Card</option><option value="debit_card">Debit Card</option>
              <option value="upi">UPI</option><option value="net_banking">Net Banking</option>
              <option value="wallet">Wallet</option><option value="auto_debit">Auto Debit</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Shared with</label>
            <select value={form.sharedWith} onChange={(e) => setForm({ ...form, sharedWith: e.target.value })} className="sf-input">
              <option value="">Just me</option><option value="family">Family</option><option value="team">Team</option>
            </select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={form.autoRenew} onChange={(e) => setForm({ ...form, autoRenew: e.target.checked })} className="rounded" />
              <span style={{ color: "var(--text-secondary)" }}>Auto-renew</span>
            </label>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Website</label>
          <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="sf-input" placeholder="https://..." />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Notes</label>
          <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="sf-input" />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="sf-btn sf-btn-primary flex-1">{saving ? "Saving..." : "Save changes"}</button>
          <button type="button" onClick={() => router.back()} className="sf-btn sf-btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
