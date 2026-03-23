"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ServiceLogo } from "@/components/ui/service-logo";
import { fmt } from "@/lib/currency-symbols";

interface Subscription {
  id: string; serviceName: string; planName: string | null; amount: number; currency: string; billingCycle: string;
  nextRenewal: string | null; category: string | null; status: string;
  paymentMethod: string | null; cardLast4: string | null; autoRenew: boolean; sharedWith: string | null;
  website: string | null; logoUrl: string | null; source: string; notes: string | null;
  startedAt: string | null; createdAt: string;
  payments: { id: string; amount: number; currency: string; paidAt: string }[];
}

interface Alternative {
  name: string;
  slug: string;
  cheapest_price: number;
  currency: string;
}

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [loadingAlts, setLoadingAlts] = useState(false);

  useEffect(() => {
    fetch(`/api/subscriptions/${params.id}`).then((r) => r.json()).then((d) => { setSub(d); setLoading(false); });
  }, [params.id]);

  function findAlternatives() {
    if (!sub) return;
    setLoadingAlts(true);
    fetch(`/api/alternatives?service=${encodeURIComponent(sub.serviceName)}`)
      .then((r) => r.json())
      .then((d) => { setAlternatives(d.alternatives || []); setLoadingAlts(false); })
      .catch(() => setLoadingAlts(false));
  }

  async function setStatus(status: string) {
    await fetch(`/api/subscriptions/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setSub((p) => p ? { ...p, status } : null);
  }

  async function handleDelete() {
    if (!confirm("Delete this subscription permanently?")) return;
    await fetch(`/api/subscriptions/${params.id}`, { method: "DELETE" });
    router.push("/subscriptions");
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64" style={{ color: "var(--text-tertiary)" }}>
      <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8"/></svg>
    </div>
  );
  if (!sub) return <div className="text-center py-12 text-sm" style={{ color: "var(--text-tertiary)" }}>Not found</div>;

  return (
    <div className="max-w-2xl space-y-5">
      <button onClick={() => router.back()} className="sf-btn sf-btn-ghost text-xs -ml-2" style={{ color: "var(--text-tertiary)" }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back
      </button>

      {/* Header */}
      <div className="sf-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ServiceLogo name={sub.serviceName} website={sub.website} logoUrl={sub.logoUrl} size={44} />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{sub.serviceName}</h1>
            <p className="text-[11px] mt-0.5 flex items-center gap-1.5" style={{ color: "var(--text-tertiary)" }}>
              <span className="capitalize">{sub.billingCycle}</span>
              <span>&middot;</span>
              <span className="capitalize">{sub.category || "other"}</span>
              <span>&middot;</span>
              <span>via {sub.source}</span>
            </p>
          </div>
        </div>
        <span className={`sf-badge ${sub.status === "active" ? "sf-badge-green" : sub.status === "cancelled" ? "sf-badge-red" : "sf-badge-yellow"}`}>
          {sub.status}
        </span>
      </div>

      {/* Details grid */}
      <div className="sf-card">
        <div className="grid grid-cols-2 divide-x" style={{ borderColor: "var(--border-default)" }}>
          <div className="p-4">
            <p className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Amount</p>
            <p className="text-xl font-semibold mt-1 tabular-nums">{fmt(sub.amount, sub.currency)}</p>
            <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>per {sub.billingCycle === "monthly" ? "month" : sub.billingCycle === "yearly" ? "year" : sub.billingCycle}</p>
          </div>
          <div className="p-4" style={{ borderColor: "var(--border-default)" }}>
            <p className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Next renewal</p>
            <p className="text-xl font-semibold mt-1">
              {sub.nextRenewal ? new Date(sub.nextRenewal).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
            </p>
            {sub.nextRenewal && (
              <p className="text-[11px]" style={{ color: Math.ceil((new Date(sub.nextRenewal).getTime() - Date.now()) / 86400000) <= 3 ? "var(--red)" : "var(--text-tertiary)" }}>
                {Math.ceil((new Date(sub.nextRenewal).getTime() - Date.now()) / 86400000)} days left
              </p>
            )}
          </div>
        </div>
        <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: "var(--border-default)" }}>
          {[
            { label: "Plan", value: sub.planName },
            { label: "Payment", value: sub.paymentMethod?.replace("_", " ") },
            { label: "Card", value: sub.cardLast4 ? `•••• ${sub.cardLast4}` : null },
            { label: "Shared", value: sub.sharedWith },
            { label: "Auto-renew", value: sub.autoRenew ? "Yes" : "No" },
            { label: "Website", value: sub.website, link: true },
            { label: "Source", value: sub.source },
            { label: "Notes", value: sub.notes },
            { label: "Started", value: sub.startedAt ? new Date(sub.startedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null },
            { label: "Added", value: new Date(sub.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
          ].filter((r) => r.value).map((r) => (
            <div key={r.label} className="flex items-center gap-2">
              <span className="text-[11px] font-medium w-16 capitalize" style={{ color: "var(--text-tertiary)" }}>{r.label}</span>
              {r.link ? (
                <a href={r.value!} target="_blank" rel="noopener noreferrer" className="text-[12px] capitalize" style={{ color: "var(--accent-text)" }}>{r.value}</a>
              ) : (
                <span className="text-[12px] capitalize" style={{ color: "var(--text-secondary)" }}>{r.value}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {sub.status === "active" && (
          <>
            <button onClick={() => setStatus("paused")} className="sf-btn sf-btn-secondary text-xs">Pause</button>
            <button onClick={() => setStatus("cancelled")} className="sf-btn sf-btn-danger text-xs">Cancel subscription</button>
          </>
        )}
        {sub.status !== "active" && (
          <button onClick={() => setStatus("active")} className="sf-btn sf-btn-primary text-xs">Reactivate</button>
        )}
        <button onClick={handleDelete} className="sf-btn sf-btn-ghost text-xs ml-auto" style={{ color: "var(--red)" }}>Delete</button>
      </div>

      {/* Payment History */}
      {sub.payments.length > 0 && (
        <div className="sf-card">
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Payment history</span>
          </div>
          {sub.payments.map((p, i) => (
            <div key={p.id} className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: i < sub.payments.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
              <span className="text-[12px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
                {new Date(p.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
              <span className="text-[13px] font-medium tabular-nums">{fmt(p.amount, p.currency)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Alternatives */}
      <div className="sf-card">
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border-default)" }}>
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Cheaper alternatives</span>
          {alternatives.length === 0 && (
            <button onClick={findAlternatives} disabled={loadingAlts} className="sf-btn sf-btn-ghost text-[11px]" style={{ color: "var(--accent-text)" }}>
              {loadingAlts ? "Finding..." : "Find alternatives"}
            </button>
          )}
        </div>
        {alternatives.length > 0 ? (
          <div>
            {alternatives.map((alt, i) => (
              <div key={alt.slug} className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: i < alternatives.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <span className="text-[13px] font-medium">{alt.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] tabular-nums font-medium">{fmt(alt.cheapest_price, alt.currency)}</span>
                  {alt.cheapest_price < sub.amount && (
                    <span className="sf-badge sf-badge-green text-[10px]">
                      Save {sub.currency} {(sub.amount - alt.cheapest_price).toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : !loadingAlts ? (
          <div className="px-4 py-6 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            Click &quot;Find alternatives&quot; to discover cheaper options
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            <svg className="animate-spin mx-auto" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8"/></svg>
          </div>
        )}
      </div>
    </div>
  );
}
