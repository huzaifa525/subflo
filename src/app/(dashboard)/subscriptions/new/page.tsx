"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ServiceLogo } from "@/components/ui/service-logo";

interface Plan {
  name: string;
  price: number;
  currency: string;
  cycle: string;
  yearlyPrice?: number;
}

interface Service {
  id: string;
  name: string;
  website: string;
  category: string;
  plans: Plan[];
}

export default function NewSubscriptionPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingToggle, setBillingToggle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"search" | "manual">("search");
  const [fetchingPricing, setFetchingPricing] = useState(false);
  const [pricingSource, setPricingSource] = useState<"local" | "aristocles">("local");
  const [pricingError, setPricingError] = useState("");

  const [form, setForm] = useState({
    serviceName: "",
    planName: "",
    amount: "",
    currency: "INR",
    billingCycle: "monthly",
    nextRenewal: "",
    category: "",
    paymentMethod: "",
    sharedWith: "",
    website: "",
    notes: "",
  });

  useEffect(() => {
    if (search.length < 1) { setSuggestions([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/services/search?q=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((d) => setSuggestions(d.services || []));
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  function selectService(service: Service) {
    setSelectedService(service);
    setSelectedPlan(null);
    setSearch("");
    setSuggestions([]);
    setPricingSource("local");
    setPricingError("");
    setForm({ ...form, serviceName: service.name, website: service.website, category: service.category });
  }

  async function fetchLivePricing() {
    if (!selectedService?.website) return;
    setFetchingPricing(true);
    setPricingError("");
    try {
      const res = await fetch("/api/pricing/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceName: selectedService.name }),
      });
      const data = await res.json();

      if (res.status === 401) {
        setPricingError("Session expired. Please refresh the page.");
        setFetchingPricing(false);
        return;
      }

      if (data.plans && data.plans.length > 0) {
        // Merge: live monthly from Aristocles + yearly from local DB if missing
        const localPlans = selectedService.plans || [];
        const livePlans: Plan[] = data.plans.map((p: { name: string; monthly_price: number | null; yearly_price: number | null; currency: string }) => {
          let yearly = p.yearly_price;
          // If no yearly from API, check local DB for matching plan
          if (yearly == null) {
            const localMatch = localPlans.find(
              (lp) => lp.name.toLowerCase() === p.name.toLowerCase()
            );
            yearly = localMatch?.yearlyPrice ?? null;
          }
          // If still no yearly and we have monthly, estimate as 10x monthly (common discount)
          if (yearly == null && p.monthly_price) {
            yearly = Math.round(p.monthly_price * 10);
          }
          return {
            name: p.name,
            price: p.monthly_price ?? p.yearly_price ?? 0,
            currency: p.currency || "USD",
            cycle: p.monthly_price != null ? "monthly" : "yearly",
            yearlyPrice: yearly ?? undefined,
          };
        });
        setSelectedService({ ...selectedService, plans: livePlans });
        setSelectedPlan(null);
        setPricingSource("aristocles");
      } else {
        setPricingError(data.message || data.error || `"${selectedService.name}" not found in pricing database`);
      }
    } catch (err) {
      setPricingError(err instanceof Error ? err.message : "Network error. Check your connection.");
    }
    setFetchingPricing(false);
  }

  function selectPlan(plan: Plan, cycle?: "monthly" | "yearly") {
    setSelectedPlan(plan);
    const useYearly = (cycle || billingToggle) === "yearly" && plan.yearlyPrice;
    const price = useYearly ? plan.yearlyPrice! : plan.price;
    const billCycle = useYearly ? "yearly" : plan.cycle;
    setForm({ ...form, amount: String(price), currency: plan.currency, billingCycle: billCycle });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    if (res.ok) router.push("/subscriptions");
    else { setLoading(false); }
  }

  return (
    <div className="max-w-xl">
      <button onClick={() => router.back()} className="sf-btn sf-btn-ghost text-xs mb-4 -ml-2" style={{ color: "var(--text-tertiary)" }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back
      </button>

      <h1 className="text-lg font-semibold tracking-tight">Add subscription</h1>
      <p className="text-xs mt-1 mb-6" style={{ color: "var(--text-tertiary)" }}>Search a service or add manually</p>

      {/* Mode tabs */}
      <div className="flex gap-1 p-0.5 rounded-lg mb-5" style={{ background: "var(--bg-tertiary)" }}>
        {(["search", "manual"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setSelectedService(null); setSelectedPlan(null); }}
            className="flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-all"
            style={{
              background: mode === m ? "var(--bg-secondary)" : "transparent",
              color: mode === m ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: mode === m ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
            }}
          >
            {m === "search" ? "Search service" : "Manual entry"}
          </button>
        ))}
      </div>

      {/* Search Mode */}
      {mode === "search" && !selectedService && (
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Netflix, Spotify, ChatGPT, Jio..."
            className="sf-input"
            autoFocus
          />
          {suggestions.length > 0 && (
            <div className="absolute z-20 w-full mt-1 sf-card max-h-72 overflow-y-auto shadow-xl">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectService(s)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <ServiceLogo name={s.name} website={s.website} size={24} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium">{s.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{s.category}{s.plans?.length ? ` · ${s.plans.length} plan${s.plans.length > 1 ? "s" : ""}` : ""}</p>
                  </div>
                  {s.plans?.[0] && (
                    <span className="text-[11px] tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                      from {s.plans[0].currency} {s.plans[0].price}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plan Selection */}
      {mode === "search" && selectedService && (
        <div className="space-y-4">
          {/* Selected service header */}
          <div className="sf-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ServiceLogo name={selectedService.name} website={selectedService.website} size={36} />
              <div>
                <p className="text-sm font-semibold">{selectedService.name}</p>
                <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{selectedService.category}</p>
              </div>
            </div>
            <button onClick={() => { setSelectedService(null); setSelectedPlan(null); }} className="sf-btn sf-btn-ghost text-[11px]">Change</button>
          </div>

          {/* Fetch live pricing */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              {pricingSource === "local" && <span className="sf-badge sf-badge-blue">Default pricing</span>}
              {pricingSource === "aristocles" && <span className="sf-badge sf-badge-green">Live pricing</span>}
            </div>
            <button
              onClick={fetchLivePricing}
              disabled={fetchingPricing || !selectedService?.website}
              className="sf-btn sf-btn-ghost text-[11px]"
              style={{ color: "var(--accent-text)" }}
            >
              {fetchingPricing ? (
                <><svg className="animate-spin" width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8"/></svg> Fetching from website...</>
              ) : (
                <><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M1 8a7 7 0 0114 0M15 8a7 7 0 01-14 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> Fetch live pricing</>
              )}
            </button>
          </div>
          {pricingError && <p className="text-[11px] px-1" style={{ color: "var(--yellow)" }}>{pricingError}</p>}

          {/* Billing toggle */}
          {selectedService.plans.some((p) => p.yearlyPrice) && (
            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Billing cycle</p>
              <div className="flex gap-1 p-0.5 rounded-lg w-fit" style={{ background: "var(--bg-tertiary)" }}>
                {(["monthly", "yearly"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => { setBillingToggle(c); if (selectedPlan) selectPlan(selectedPlan, c); }}
                    className="px-3 py-1.5 rounded-md text-[11px] font-medium capitalize transition-all"
                    style={{
                      background: billingToggle === c ? "var(--bg-secondary)" : "transparent",
                      color: billingToggle === c ? "var(--text-primary)" : "var(--text-tertiary)",
                      boxShadow: billingToggle === c ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
                    }}
                  >
                    {c}{c === "yearly" ? " (save ~15%)" : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Plans */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Select plan</p>
            <div className="grid gap-2">
              {selectedService.plans.map((plan) => {
                const active = selectedPlan?.name === plan.name;
                const showYearly = billingToggle === "yearly" && plan.yearlyPrice;
                const displayPrice = showYearly ? plan.yearlyPrice! : plan.price;
                const displayCycle = showYearly ? "yearly" : plan.cycle;
                const monthlySaving = showYearly ? plan.price * 12 - plan.yearlyPrice! : 0;
                return (
                  <button
                    key={plan.name}
                    onClick={() => selectPlan(plan)}
                    className="flex items-center justify-between p-3 rounded-lg border text-left transition-all"
                    style={{
                      background: active ? "var(--accent-muted)" : "var(--bg-secondary)",
                      borderColor: active ? "var(--accent)" : "var(--border-default)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: active ? "var(--accent)" : "var(--border-active)" }}
                      >
                        {active && <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />}
                      </div>
                      <div>
                        <span className="text-[13px] font-medium">{plan.name}</span>
                        {showYearly && monthlySaving > 0 && (
                          <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "var(--green-muted)", color: "var(--green)" }}>
                            Save {plan.currency} {monthlySaving}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[13px] font-semibold tabular-nums">{plan.currency} {displayPrice}</span>
                      <span className="text-[11px] ml-1" style={{ color: "var(--text-tertiary)" }}>/{displayCycle}</span>
                      {showYearly && (
                        <p className="text-[10px] tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                          ({plan.currency} {(plan.yearlyPrice! / 12).toFixed(0)}/mo)
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Renewal date + notes */}
          {selectedPlan && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Next renewal</label>
                <input
                  type="date"
                  value={form.nextRenewal}
                  onChange={(e) => setForm({ ...form, nextRenewal: e.target.value })}
                  className="sf-input"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Notes (optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="sf-input"
                  placeholder="e.g. shared with family"
                />
              </div>
              <button onClick={handleSubmit} disabled={loading} className="sf-btn sf-btn-primary w-full mt-2">
                {loading ? "Adding..." : "Add subscription"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual Mode */}
      {mode === "manual" && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Service name *</label>
            <input type="text" value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} className="sf-input" required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Amount *</label>
              <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="sf-input" required />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Currency</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="sf-input">
                <option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="AED">AED</option>
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
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="sf-input">
                <option value="">Select</option>
                {["entertainment","music","productivity","developer","cloud","health","education","shopping","telecom","finance","other"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Next renewal</label>
              <input type="date" value={form.nextRenewal} onChange={(e) => setForm({ ...form, nextRenewal: e.target.value })} className="sf-input" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Payment method</label>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="sf-input">
                <option value="">Select</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="upi">UPI</option>
                <option value="net_banking">Net Banking</option>
                <option value="wallet">Wallet</option>
                <option value="auto_debit">Auto Debit</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Shared with</label>
              <select value={form.sharedWith} onChange={(e) => setForm({ ...form, sharedWith: e.target.value })} className="sf-input">
                <option value="">Just me</option>
                <option value="family">Family</option>
                <option value="team">Team</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Plan name</label>
              <input type="text" value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} className="sf-input" placeholder="e.g. Premium" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Website</label>
            <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="sf-input" placeholder="https://..." />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Notes</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="sf-input" placeholder="Optional" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="sf-btn sf-btn-primary flex-1">{loading ? "Adding..." : "Add subscription"}</button>
            <button type="button" onClick={() => router.back()} className="sf-btn sf-btn-secondary">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
