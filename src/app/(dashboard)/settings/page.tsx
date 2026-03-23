"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const LLM_PROVIDERS = [
  { id: "ollama", name: "Ollama", baseUrl: "http://localhost:11434/v1", needsKey: false },
  { id: "openrouter", name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", needsKey: true },
  { id: "groq", name: "Groq", baseUrl: "https://api.groq.com/openai/v1", needsKey: true },
  { id: "openai", name: "OpenAI", baseUrl: "https://api.openai.com/v1", needsKey: true },
  { id: "together", name: "Together", baseUrl: "https://api.together.xyz/v1", needsKey: true },
  { id: "custom", name: "Custom", baseUrl: "", needsKey: true },
];

interface Settings {
  setupMode: string; dbType: string;
  llmProvider: string; llmBaseUrl: string; llmModel: string; hasLlmKey: boolean;
  gmailEnabled: boolean;
  outlookEnabled: boolean; outlookClientId: string; outlookTenantId: string; hasOutlookSecret: boolean; outlookConnected: boolean;
  currency: string; country: string; remindDaysBefore: number; monthlyBudget: number;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // LLM
  const [ep, setEp] = useState("");
  const [eUrl, setEUrl] = useState("");
  const [eKey, setEKey] = useState("");
  const [eModel, setEModel] = useState("");
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState("");

  // Gmail
  const [gEmail, setGEmail] = useState("");
  const [gPass, setGPass] = useState("");
  const [gLabel, setGLabel] = useState("");
  const [gmailAccounts, setGmailAccounts] = useState<{ email: string; label: string | null; lastScanAt: string | null }[]>([]);
  const [gmailHelp, setGmailHelp] = useState(false);
  const [gmailTesting, setGmailTesting] = useState(false);
  const [gmailStatus, setGmailStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [gmailScanning, setGmailScanning] = useState(false);
  const [gmailScanResult, setGmailScanResult] = useState<{ scanned: number; subscriptions: number; results: unknown[]; error?: string } | null>(null);
  const [trackedEmails, setTrackedEmails] = useState<Set<number>>(new Set());

  // Outlook
  const [outlookHelp, setOutlookHelp] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/email/test").then((r) => r.json()),
    ]).then(([d, g]) => {
      setS(d);
      if (d.setupMode) localStorage.setItem("subflo-setup-mode", d.setupMode);
      setEp(d.llmProvider); setEUrl(d.llmBaseUrl); setEModel(d.llmModel);
      setGmailAccounts(g.accounts || []);
      setLoading(false);
    });
  }, []);

  function pickProvider(id: string) {
    const p = LLM_PROVIDERS.find((x) => x.id === id)!;
    setEp(id); if (p.baseUrl) setEUrl(p.baseUrl); setEKey(""); setModels([]); setFetchErr("");
  }

  async function fetchModels() {
    setFetching(true); setFetchErr("");
    try {
      const res = await fetch("/api/models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ baseUrl: eUrl, apiKey: eKey }) });
      const d = await res.json();
      if (d.models?.length) { setModels(d.models); setEModel(d.models[0].id); }
      else setFetchErr(ep === "ollama" ? "No models. Is Ollama running?" : "Check your API key.");
    } catch { setFetchErr("Connection failed."); }
    setFetching(false);
  }

  async function save(updates: Record<string, unknown>) {
    setSaving(true);
    await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
    setS((prev) => prev ? { ...prev, ...updates } as Settings : null);
    setSaving(false); setToast("Saved"); setTimeout(() => setToast(""), 2000);
  }

  function exportData(fmt: string) {
    fetch(`/api/export?format=${fmt}`).then(async (r) => {
      const blob = await r.blob();
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `subflo.${fmt}`; a.click();
    });
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64" style={{ color: "var(--text-tertiary)" }}>
      <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8"/></svg>
    </div>
  );

  const selProv = LLM_PROVIDERS.find((p) => p.id === ep);

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Everything configurable in one place</p>
        </div>
        {toast && <span className="sf-badge sf-badge-green text-[11px]">{toast}</span>}
      </div>

      {/* Account */}
      <div className="sf-card p-4">
        <h2 className="text-[13px] font-semibold mb-3">Account</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Email</p>
            <p className="text-[13px] mt-0.5">{session?.user?.email || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Name</p>
            <p className="text-[13px] mt-0.5">{session?.user?.name || "—"}</p>
          </div>
        </div>
      </div>

      {/* ━━━ AI Model ━━━ */}
      <div className="sf-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-semibold">AI Model</h2>
          {s?.hasLlmKey && <span className="sf-badge sf-badge-green">Connected</span>}
        </div>
        <div>
          <p className="text-[11px] font-medium mb-1.5" style={{ color: "var(--text-tertiary)" }}>Provider</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
            {LLM_PROVIDERS.map((p) => (
              <button key={p.id} onClick={() => pickProvider(p.id)} className="py-2 rounded-md text-center transition-all" style={{
                background: ep === p.id ? "var(--accent-muted)" : "var(--bg-primary)",
                color: ep === p.id ? "var(--accent-text)" : "var(--text-tertiary)",
                border: ep === p.id ? "1px solid var(--accent)" : "1px solid var(--border-default)",
              }}>
                <p className="text-[11px] font-medium">{p.name}</p>
              </button>
            ))}
          </div>
        </div>
        {ep === "custom" && (
          <div>
            <p className="text-[11px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Base URL</p>
            <input type="url" value={eUrl} onChange={(e) => setEUrl(e.target.value)} className="sf-input" placeholder="https://..." />
          </div>
        )}
        {selProv?.needsKey && (
          <div>
            <p className="text-[11px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>API Key</p>
            <input type="password" value={eKey} onChange={(e) => setEKey(e.target.value)} className="sf-input" placeholder={s?.hasLlmKey ? "••••••••••" : "Enter key"} />
          </div>
        )}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Model</p>
            <button onClick={fetchModels} disabled={fetching} className="text-[11px] font-medium" style={{ color: "var(--accent-text)" }}>
              {fetching ? "Fetching..." : "Fetch models"}
            </button>
          </div>
          {models.length > 0 ? (
            <select value={eModel} onChange={(e) => setEModel(e.target.value)} className="sf-input">{models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          ) : (
            <input type="text" value={eModel} onChange={(e) => setEModel(e.target.value)} className="sf-input" placeholder="e.g. llama3.1:8b" />
          )}
          {fetchErr && <p className="text-[11px] mt-1" style={{ color: "var(--yellow)" }}>{fetchErr}</p>}
        </div>
        <button onClick={() => save({ llmProvider: ep, llmBaseUrl: eUrl, ...(eKey && { llmApiKey: eKey }), llmModel: eModel })} disabled={saving} className="sf-btn sf-btn-primary text-xs">
          {saving ? "Saving..." : "Save AI config"}
        </button>
      </div>

      {/* ━━━ Gmail (Multiple Accounts) ━━━ */}
      <div className="sf-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: "var(--text-tertiary)" }}><path d="M1 4l7 5 7-5M1 4v8a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2H3a2 2 0 00-2 2z" stroke="currentColor" strokeWidth="1.3"/></svg>
            <h2 className="text-[13px] font-semibold">Gmail</h2>
            {gmailAccounts.length > 0 && <span className="sf-badge sf-badge-green">{gmailAccounts.length} account{gmailAccounts.length > 1 ? "s" : ""}</span>}
          </div>
          <button className="sf-toggle" data-active={String(!!s?.gmailEnabled)} onClick={() => save({ gmailEnabled: !s?.gmailEnabled })} />
        </div>

        {s?.gmailEnabled && (
          <div className="space-y-3 pt-1">
            {/* Connected accounts list */}
            {gmailAccounts.length > 0 && (
              <div className="space-y-1.5">
                {gmailAccounts.map((acc) => (
                  <div key={acc.email} className="flex items-center justify-between py-2 px-2.5 rounded-lg" style={{ background: "var(--bg-primary)" }}>
                    <div>
                      <p className="text-[12px] font-medium">{acc.email}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                        {acc.label || "Personal"} {acc.lastScanAt ? `· Last scan: ${new Date(acc.lastScanAt).toLocaleDateString()}` : "· Never scanned"}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        await fetch("/api/email/test", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: acc.email }) });
                        setGmailAccounts(gmailAccounts.filter((a) => a.email !== acc.email));
                      }}
                      className="sf-btn sf-btn-ghost text-[10px]" style={{ color: "var(--red)" }}
                    >Remove</button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new account form */}
            <p className="text-[11px] font-medium pt-1" style={{ color: "var(--text-secondary)" }}>{gmailAccounts.length > 0 ? "Add another account" : "Add Gmail account"}</p>
            <div className="grid grid-cols-2 gap-2">
              <input type="email" value={gEmail} onChange={(e) => setGEmail(e.target.value)} className="sf-input" placeholder="your.email@gmail.com" />
              <input type="text" value={gLabel} onChange={(e) => setGLabel(e.target.value)} className="sf-input" placeholder="Label (e.g. Work)" />
            </div>
            <div>
              <input type="password" value={gPass} onChange={(e) => setGPass(e.target.value)} className="sf-input" placeholder="App Password (xxxx xxxx xxxx xxxx)" />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={async () => {
                  setGmailTesting(true); setGmailStatus(null);
                  const res = await fetch("/api/email/test", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: gEmail, appPassword: gPass, label: gLabel || undefined }),
                  });
                  const data = await res.json();
                  setGmailStatus({
                    success: data.success,
                    message: data.success ? `Connected ${gEmail}` : data.error || "Connection failed",
                  });
                  if (data.success) {
                    setGmailAccounts([...gmailAccounts, { email: gEmail, label: gLabel || null, lastScanAt: null }]);
                    setGEmail(""); setGPass(""); setGLabel("");
                    // Auto-scan immediately after connecting
                    setGmailScanning(true);
                    fetch("/api/email/scan", { method: "POST" }).then((r) => r.json()).then((d) => {
                      setGmailScanResult(d);
                      setGmailScanning(false);
                    });
                  }
                  setGmailTesting(false);
                }}
                disabled={gmailTesting || !gEmail || !gPass}
                className="sf-btn sf-btn-primary text-xs"
              >
                {gmailTesting ? "Testing..." : "Add & Test"}
              </button>
              <button onClick={() => setGmailHelp(!gmailHelp)} className="sf-btn sf-btn-ghost text-[11px]" style={{ color: "var(--accent-text)" }}>
                {gmailHelp ? "Hide guide" : "How to get App Password?"}
              </button>
            </div>

            {/* Connection status */}
            {gmailStatus && (
              <div className="rounded-lg p-3 text-[12px] flex items-center gap-2" style={{
                background: gmailStatus.success ? "var(--green-muted)" : "var(--red-muted)",
                color: gmailStatus.success ? "var(--green)" : "var(--red)",
              }}>
                {gmailStatus.success ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 8l2 2L10.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M6 6l4 4M10 6l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                )}
                <span className="font-medium">{gmailStatus.message}</span>
              </div>
            )}

            {/* Scan emails button — only show when connected */}
            {(gmailStatus?.success || gmailAccounts.length > 0) && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>Scan inbox for subscriptions</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={async () => {
                        // Force rescan — clear old records first
                        await fetch("/api/email/reset", { method: "POST" });
                        setGmailScanning(true);
                        setGmailScanResult(null);
                        setTrackedEmails(new Set());
                        const res = await fetch("/api/email/scan", { method: "POST" });
                        const data = await res.json();
                        setGmailScanResult(data);
                        setGmailScanning(false);
                      }}
                      disabled={gmailScanning}
                      className="sf-btn sf-btn-secondary text-xs"
                    >
                      {gmailScanning ? (
                        <><svg className="animate-spin" width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8"/></svg> Scanning...</>
                      ) : (
                        <><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M1 4l7 5 7-5M1 4v8a2 2 0 002 2h10a2 2 0 002-2V4" stroke="currentColor" strokeWidth="1.3"/></svg> Scan inbox</>
                      )}
                    </button>
                  </div>
                </div>

                {gmailScanning && (
                  <div className="rounded-lg p-3 text-[11px] flex items-center gap-2" style={{ background: "var(--accent-muted)", color: "var(--accent-text)" }}>
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8"/></svg>
                    Scanning emails and parsing with AI... This may take a minute.
                  </div>
                )}

                {gmailScanResult && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="sf-badge sf-badge-blue">{gmailScanResult.scanned} emails scanned</span>
                      <span className="sf-badge sf-badge-green">{gmailScanResult.subscriptions} subscriptions found</span>
                    </div>

                    {(gmailScanResult.results as { subject: string; from: string; date: string; website?: string; htmlPreview?: string; nextRenewal?: string; localMatch?: { category: string; website: string }; parsed: { service_name: string; plan_name?: string; amount: number; currency: string; billing_cycle: string; payment_method?: string; card_last4?: string; category?: string } | null }[])
                      .filter((r) => r.parsed)
                      .map((r, i) => {
                        const tracked = trackedEmails.has(i);
                        return (
                          <div key={i} className="rounded-lg p-3 flex items-center justify-between" style={{ background: "var(--bg-primary)", border: `1px solid ${tracked ? "var(--green)" : "var(--border-default)"}` }}>
                            <div className="min-w-0 flex-1 mr-3">
                              <div className="flex items-center gap-2">
                                <p className="text-[13px] font-medium truncate">{r.parsed!.service_name || r.subject}</p>
                                {r.parsed!.plan_name && <span className="sf-badge sf-badge-blue text-[9px]">{r.parsed!.plan_name}</span>}
                              </div>
                              <p className="text-[11px] truncate" style={{ color: "var(--text-tertiary)" }}>
                                {r.from.split("<")[0].trim()} &middot; {new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                                {r.parsed!.payment_method && ` · ${r.parsed!.payment_method.replace("_", " ")}`}
                                {r.parsed!.card_last4 && ` ****${r.parsed!.card_last4}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {r.parsed!.amount != null && (
                                <span className="text-[13px] font-medium tabular-nums">{r.parsed!.currency || "INR"} {r.parsed!.amount}</span>
                              )}
                              {tracked ? (
                                <span className="sf-badge sf-badge-green">Added</span>
                              ) : (
                                <button
                                  onClick={async () => {
                                    const res = await fetch("/api/subscriptions", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        serviceName: r.parsed!.service_name || "Unknown",
                                        planName: r.parsed!.plan_name || null,
                                        amount: r.parsed!.amount || 0,
                                        currency: r.parsed!.currency || "INR",
                                        billingCycle: r.parsed!.billing_cycle || "monthly",
                                        nextRenewal: r.nextRenewal || null,
                                        category: r.localMatch?.category || r.parsed!.category || null,
                                        website: r.website || r.localMatch?.website || null,
                                        paymentMethod: r.parsed!.payment_method || null,
                                        cardLast4: r.parsed!.card_last4 || null,
                                        source: "email",
                                        receiptHtml: r.htmlPreview || null,
                                        receiptSubject: r.subject,
                                        receiptFrom: r.from,
                                        receiptDate: r.date,
                                      }),
                                    });
                                    if (res.ok) {
                                      setTrackedEmails((prev) => new Set(prev).add(i));
                                      setToast(`Added ${r.parsed!.service_name}`);
                                    } else {
                                      const err = await res.json();
                                      setToast(err.error || "Failed to add");
                                    }
                                    setTimeout(() => setToast(""), 3000);
                                  }}
                                  className="sf-btn sf-btn-primary text-[11px] py-1 px-2.5"
                                >
                                  + Track
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    {gmailScanResult.subscriptions === 0 && (
                      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                        {gmailScanResult.error || "No subscription emails found. Try scanning again later or check the Inbox page."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Gmail Setup Guide */}
            {gmailHelp && (
              <div className="rounded-lg p-4 space-y-3 text-[12px] leading-relaxed" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-default)" }}>
                <p className="font-semibold text-[13px]">Gmail App Password Setup</p>

                <div className="space-y-2">
                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "var(--accent-muted)", color: "var(--accent-text)" }}>1</span>
                    <div>
                      <p className="font-medium">Enable 2-Step Verification</p>
                      <p style={{ color: "var(--text-tertiary)" }}>
                        Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-text)" }}>myaccount.google.com/security</a> → 2-Step Verification → Turn on
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "var(--accent-muted)", color: "var(--accent-text)" }}>2</span>
                    <div>
                      <p className="font-medium">Generate App Password</p>
                      <p style={{ color: "var(--text-tertiary)" }}>
                        Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-text)" }}>myaccount.google.com/apppasswords</a> → Name it &quot;Subflo&quot; → Create
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "var(--accent-muted)", color: "var(--accent-text)" }}>3</span>
                    <div>
                      <p className="font-medium">Copy the 16-character password</p>
                      <p style={{ color: "var(--text-tertiary)" }}>
                        Google shows a 16-character password like <code className="px-1 rounded text-[11px]" style={{ background: "var(--bg-elevated)" }}>abcd efgh ijkl mnop</code>. Paste it above.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded p-2.5" style={{ background: "var(--green-muted)" }}>
                  <p className="text-[11px] font-medium" style={{ color: "var(--green)" }}>
                    This is NOT your Gmail password. App Passwords are separate, revocable, and only grant email read access. You can delete it anytime from Google settings.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ━━━ Outlook (OAuth) ━━━ */}
      <div className="sf-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: "var(--text-tertiary)" }}><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1 5l7 4 7-4" stroke="currentColor" strokeWidth="1.3"/></svg>
            <h2 className="text-[13px] font-semibold">Outlook</h2>
            {s?.outlookConnected && <span className="sf-badge sf-badge-green">Connected</span>}
          </div>
          <button className="sf-toggle" data-active={String(!!s?.outlookEnabled)} onClick={() => save({ outlookEnabled: !s?.outlookEnabled })} />
        </div>

        {s?.outlookEnabled && (
          <div className="space-y-3 pt-1">
            {s?.outlookConnected && <span className="sf-badge sf-badge-green">Connected</span>}
            <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              <a href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-text)" }}>Register Azure AD app</a> with Mail.Read permission. Redirect URI: <code className="px-1 rounded text-[10px]" style={{ background: "var(--bg-primary)" }}>{typeof window !== "undefined" ? window.location.origin : ""}/api/auth/callback/azure-ad</code>
            </p>
            <div>
              <p className="text-[11px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Client ID</p>
              <input type="text" defaultValue={s?.outlookClientId || ""} onBlur={(e) => save({ outlookClientId: e.target.value })} className="sf-input" placeholder="xxxxxxxx-xxxx-xxxx-xxxx" />
            </div>
            <div>
              <p className="text-[11px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Client Secret</p>
              <input type="password" onBlur={(e) => { if (e.target.value) save({ outlookSecret: e.target.value }); }} className="sf-input" placeholder={s?.hasOutlookSecret ? "••••••••••" : "Enter secret"} />
            </div>
            <div>
              <p className="text-[11px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Tenant ID</p>
              <input type="text" defaultValue={s?.outlookTenantId || "common"} onBlur={(e) => save({ outlookTenantId: e.target.value })} className="sf-input" placeholder="common" />
            </div>
          </div>
        )}
      </div>


      {/* ━━━ Instance ━━━ */}
      <div className="sf-card p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Instance</h2>
        <div>
          <p className="text-[11px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>User management</p>
          <select value={s?.setupMode || "individual"} onChange={(e) => { save({ setupMode: e.target.value }); localStorage.setItem("subflo-setup-mode", e.target.value); window.location.reload(); }} className="sf-input">
            <option value="individual">Individual — just me</option>
            <option value="multi-user">Multi-user — family / team</option>
          </select>
          <p className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>
            {(s?.setupMode || "individual") === "individual" ? "Family features hidden from sidebar" : "Family dashboard and invite members enabled"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
          <span>Database:</span>
          <span className="sf-badge sf-badge-blue">{s?.dbType === "postgres" ? "PostgreSQL" : "SQLite"}</span>
          <span style={{ color: "var(--text-tertiary)" }}>(set during onboarding)</span>
        </div>
      </div>

      {/* ━━━ Preferences ━━━ */}
      <div className="sf-card p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Preferences</h2>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[11px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Currency</p>
            <select value={s?.currency || "INR"} onChange={(e) => save({ currency: e.target.value })} className="sf-input">
              <option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option>
              <option value="GBP">GBP</option><option value="AED">AED</option><option value="CAD">CAD</option>
              <option value="AUD">AUD</option><option value="JPY">JPY</option>
            </select>
          </div>
          <div>
            <p className="text-[11px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Country</p>
            <input type="text" value={s?.country || ""} onChange={(e) => save({ country: e.target.value.toUpperCase().slice(0, 2) })} className="sf-input" placeholder="Auto-detected" maxLength={2} />
          </div>
          <div>
            <p className="text-[11px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Remind before</p>
            <select value={s?.remindDaysBefore || 3} onChange={(e) => save({ remindDaysBefore: parseInt(e.target.value) })} className="sf-input">
              <option value="1">1 day</option><option value="3">3 days</option><option value="5">5 days</option><option value="7">7 days</option>
            </select>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Monthly budget (0 = no limit)</p>
          <input type="number" value={s?.monthlyBudget || ""} onChange={(e) => save({ monthlyBudget: parseFloat(e.target.value) || 0 })} className="sf-input" placeholder="e.g. 5000" />
        </div>
      </div>

      {/* ━━━ Export ━━━ */}
      <div className="sf-card p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Data</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportData("json")} className="sf-btn sf-btn-secondary text-xs">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 10V2M8 10l-3-3M8 10l3-3M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            JSON
          </button>
          <button onClick={() => exportData("csv")} className="sf-btn sf-btn-secondary text-xs">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 10V2M8 10l-3-3M8 10l3-3M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            CSV
          </button>
        </div>
      </div>

      {/* Dev credits */}
      <div className="text-center py-4 space-y-1">
        <p className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
          Subflo v1.0 &middot; Open Source &middot; MIT License
        </p>
        <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
          Designed &amp; built by <a href="https://huzefanalkhedawala.in" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-text)" }}>Huzefa Nalkheda Wala</a>
          &nbsp;&middot;&nbsp;
          <a href="https://github.com/huzaifa525/subflo" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-text)" }}>GitHub</a>
          &nbsp;&middot;&nbsp;
          <a href="https://linkedin.com/in/huzefanalkheda" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-text)" }}>LinkedIn</a>
        </p>
      </div>
    </div>
  );
}
