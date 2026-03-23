"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmt } from "@/lib/currency-symbols";

interface DetectedSub {
  service_name: string; amount: number; currency: string; billing_cycle: string;
  payment_method: string; card_last4: string | null; category: string | null; occurrences: number;
}

export default function ImportPage() {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DetectedSub[]>([]);
  const [tracked, setTracked] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsv(ev.target?.result as string || "");
    reader.readAsText(file);
  }

  async function analyze() {
    setLoading(true); setError(""); setResults([]); setTracked(new Set());
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent: csv }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      setResults(data.subscriptions || []);
    } catch { setError("Failed to analyze"); }
    setLoading(false);
  }

  async function trackItem(sub: DetectedSub, index: number) {
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceName: sub.service_name,
        amount: sub.amount,
        currency: sub.currency,
        billingCycle: sub.billing_cycle,
        paymentMethod: sub.payment_method,
        cardLast4: sub.card_last4,
        category: sub.category,
        source: "manual",
      }),
    });
    if (res.ok) setTracked((prev) => new Set(prev).add(index));
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Import</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Upload a bank statement CSV to auto-detect subscriptions</p>
      </div>

      <div className="sf-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <label className="sf-btn sf-btn-secondary text-xs cursor-pointer">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M8 2L5 5M8 2l3 3M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Choose CSV
            <input type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
          </label>
          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>or paste below</span>
        </div>

        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={6}
          placeholder={"Date,Description,Amount,Balance\n15/03/2026,NETFLIX.COM,649.00,12345.00\n15/02/2026,NETFLIX.COM,649.00,12994.00"}
          className="sf-input font-mono text-[11px] leading-relaxed resize-none"
          style={{ minHeight: 120 }}
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            {csv.split("\n").filter((l) => l.trim()).length} rows
          </span>
          <button onClick={analyze} disabled={loading || csv.length < 20} className="sf-btn sf-btn-primary text-xs">
            {loading ? "Analyzing with AI..." : "Detect subscriptions"}
          </button>
        </div>
        {error && <p className="text-[11px]" style={{ color: "var(--red)" }}>{error}</p>}
      </div>

      {results.length > 0 && (
        <div className="sf-card">
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{results.length} recurring subscriptions detected</span>
          </div>
          {results.map((sub, i) => (
            <div key={i} className="px-4 py-2.5 flex items-center justify-between border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div>
                <p className="text-[13px] font-medium">{sub.service_name}</p>
                <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  {sub.billing_cycle} &middot; {sub.occurrences}x found
                  {sub.payment_method && ` · ${sub.payment_method.replace("_", " ")}`}
                  {sub.card_last4 && ` ****${sub.card_last4}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium tabular-nums">{fmt(sub.amount, sub.currency)}</span>
                {tracked.has(i) ? (
                  <span className="sf-badge sf-badge-green">Added</span>
                ) : (
                  <button onClick={() => trackItem(sub, i)} className="sf-btn sf-btn-primary text-[11px] py-1 px-2.5">+ Track</button>
                )}
              </div>
            </div>
          ))}
          {results.length > 0 && (
            <div className="px-4 py-3 flex justify-end">
              <button onClick={() => router.push("/subscriptions")} className="sf-btn sf-btn-secondary text-xs">View all subscriptions</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
