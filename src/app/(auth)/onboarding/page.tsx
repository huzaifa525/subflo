"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const LLM_PROVIDERS = [
  { id: "ollama", name: "Ollama", baseUrl: "http://localhost:11434/v1", needsKey: false, desc: "Local, free, private" },
  { id: "openrouter", name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", needsKey: true, desc: "100+ models" },
  { id: "groq", name: "Groq", baseUrl: "https://api.groq.com/openai/v1", needsKey: true, desc: "Ultra-fast, free tier" },
  { id: "openai", name: "OpenAI", baseUrl: "https://api.openai.com/v1", needsKey: true, desc: "GPT-4o" },
  { id: "together", name: "Together", baseUrl: "https://api.together.xyz/v1", needsKey: true, desc: "Open-source" },
  { id: "custom", name: "Custom", baseUrl: "", needsKey: true, desc: "Any API" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [setupMode, setSetupMode] = useState<"individual" | "multi-user">("individual");
  const [dbType, setDbType] = useState<"sqlite" | "postgres">("sqlite");
  const [dbUrl, setDbUrl] = useState("");

  const [provider, setProvider] = useState("ollama");
  const [baseUrl, setBaseUrl] = useState("http://localhost:11434/v1");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [customModel, setCustomModel] = useState("");

  const [gmailEnabled, setGmailEnabled] = useState(false);
  const [outlookEnabled, setOutlookEnabled] = useState(false);
  const [outlookClientId, setOutlookClientId] = useState("");
  const [outlookSecret, setOutlookSecret] = useState("");
  const [outlookTenantId, setOutlookTenantId] = useState("common");

  const [currency, setCurrency] = useState("INR");
  const [remindDays, setRemindDays] = useState(3);

  function selectProvider(id: string) {
    const p = LLM_PROVIDERS.find((x) => x.id === id)!;
    setProvider(id); setBaseUrl(p.baseUrl); setApiKey(""); setModel(""); setModels([]); setFetchError("");
  }

  async function handleFetchModels() {
    setFetchingModels(true); setFetchError("");
    try {
      const res = await fetch("/api/models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ baseUrl, apiKey }) });
      const data = await res.json();
      if (data.models?.length) { setModels(data.models); setModel(data.models[0].id); }
      else setFetchError(provider === "ollama" ? "Is Ollama running? Try: ollama pull llama3.1:8b" : "Check your API key.");
    } catch { setFetchError("Connection failed."); }
    setFetchingModels(false);
  }

  async function handleComplete() {
    setSaving(true);
    const res = await fetch("/api/onboarding", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        setupMode, dbType, dbUrl,
        llmProvider: provider, llmBaseUrl: baseUrl, llmApiKey: apiKey, llmModel: customModel || model,
        gmailEnabled, outlookEnabled, outlookClientId, outlookSecret, outlookTenantId,
        currency, remindDaysBefore: remindDays,
      }),
    });
    if (!res.ok) { setSaving(false); return; }
    localStorage.setItem("subflo-setup-mode", setupMode);
    await updateSession();
    router.push("/dashboard");
    router.refresh();
  }

  const totalSteps = 4;
  const selProv = LLM_PROVIDERS.find((p) => p.id === provider)!;

  const steps = [
    { num: 1, label: "Instance" },
    { num: 2, label: "AI Model" },
    { num: 3, label: "Email" },
    { num: 4, label: "Finish" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Top bar */}
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-[10px]" style={{ background: "linear-gradient(135deg, #635bff, #7a73ff)" }}>S</div>
          <span className="text-sm font-semibold tracking-tight">Subflo</span>
        </div>
        <button onClick={handleComplete} className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>Skip setup</button>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-1 mb-8">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <button
                  onClick={() => s.num < step && setStep(s.num)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-all"
                  style={{
                    background: step === s.num ? "var(--accent-muted)" : "transparent",
                    color: step === s.num ? "var(--accent-text)" : step > s.num ? "var(--green)" : "var(--text-tertiary)",
                    cursor: s.num < step ? "pointer" : "default",
                  }}
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{
                    background: step > s.num ? "var(--green-muted)" : step === s.num ? "var(--accent)" : "var(--bg-tertiary)",
                    color: step >= s.num ? "#fff" : "var(--text-tertiary)",
                  }}>
                    {step > s.num ? "✓" : s.num}
                  </div>
                  <span className="text-[11px] font-medium hidden sm:inline">{s.label}</span>
                </button>
                {i < steps.length - 1 && <div className="w-6 sm:w-10 h-px mx-1" style={{ background: step > s.num ? "var(--green)" : "var(--border-default)" }} />}
              </div>
            ))}
          </div>

          {/* ━━━ Step 1: Instance ━━━ */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center mb-2">
                <h2 className="text-lg font-bold tracking-tight">How will you use Subflo?</h2>
                <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>This affects which features are shown</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: "individual" as const, icon: "👤", title: "Just me", desc: "Personal tracking" },
                  { id: "multi-user" as const, icon: "👥", title: "Multi-user", desc: "Family / team" },
                ]).map((m) => (
                  <button key={m.id} onClick={() => setSetupMode(m.id)} className="p-4 rounded-xl border text-center transition-all" style={{
                    background: setupMode === m.id ? "var(--accent-muted)" : "var(--bg-secondary)",
                    borderColor: setupMode === m.id ? "var(--accent)" : "var(--border-default)",
                  }}>
                    <div className="text-2xl mb-2">{m.icon}</div>
                    <p className="text-[13px] font-semibold">{m.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{m.desc}</p>
                  </button>
                ))}
              </div>

              <div>
                <p className="text-[12px] font-semibold mb-2">Database</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: "sqlite" as const, title: "SQLite", desc: "Local file, zero setup" },
                    { id: "postgres" as const, title: "PostgreSQL", desc: "Cloud, production" },
                  ]).map((d) => (
                    <button key={d.id} onClick={() => setDbType(d.id)} className="p-3 rounded-lg border text-left transition-all" style={{
                      background: dbType === d.id ? "var(--accent-muted)" : "var(--bg-secondary)",
                      borderColor: dbType === d.id ? "var(--accent)" : "var(--border-default)",
                    }}>
                      <p className="text-[12px] font-medium">{d.title}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{d.desc}</p>
                    </button>
                  ))}
                </div>
                {dbType === "postgres" && (
                  <input type="text" value={dbUrl} onChange={(e) => setDbUrl(e.target.value)} className="sf-input mt-2 font-mono text-[11px]" placeholder="postgresql://user:pass@host:5432/subflo" />
                )}
              </div>

              <button onClick={() => setStep(2)} className="sf-btn sf-btn-primary w-full">Continue</button>
            </div>
          )}

          {/* ━━━ Step 2: LLM ━━━ */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-lg font-bold tracking-tight">AI Model</h2>
                <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>Parses emails and extracts subscription data</p>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {LLM_PROVIDERS.map((p) => (
                  <button key={p.id} onClick={() => selectProvider(p.id)} className="p-2.5 rounded-lg border text-center transition-all" style={{
                    background: provider === p.id ? "var(--accent-muted)" : "var(--bg-secondary)",
                    borderColor: provider === p.id ? "var(--accent)" : "var(--border-default)",
                  }}>
                    <p className="text-[11px] font-medium">{p.name}</p>
                    <p className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>{p.desc}</p>
                  </button>
                ))}
              </div>

              {provider === "custom" && (
                <div>
                  <label className="text-[11px] font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>Base URL</label>
                  <input type="url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="sf-input" />
                </div>
              )}

              {selProv.needsKey && (
                <div>
                  <label className="text-[11px] font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>API Key</label>
                  <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="sf-input" placeholder={`${selProv.name} API key`} />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Model</label>
                  <button onClick={handleFetchModels} disabled={fetchingModels} className="text-[11px] font-medium" style={{ color: "var(--accent-text)" }}>
                    {fetchingModels ? "Fetching..." : "Fetch models"}
                  </button>
                </div>
                {models.length > 0 ? (
                  <select value={model} onChange={(e) => setModel(e.target.value)} className="sf-input">{models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                ) : (
                  <input type="text" value={customModel} onChange={(e) => setCustomModel(e.target.value)} className="sf-input" placeholder="e.g. llama3.1:8b" />
                )}
                {fetchError && <p className="text-[11px] mt-1" style={{ color: "var(--yellow)" }}>{fetchError}</p>}
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setStep(1)} className="sf-btn sf-btn-secondary flex-1">Back</button>
                <button onClick={() => setStep(3)} className="sf-btn sf-btn-primary flex-1">Continue</button>
              </div>
            </div>
          )}

          {/* ━━━ Step 3: Email ━━━ */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-lg font-bold tracking-tight">Email sources</h2>
                <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>Configure details in Settings after setup</p>
              </div>

              <div className="space-y-2">
                <div className="p-4 rounded-xl border flex items-center justify-between" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}>
                  <div>
                    <p className="text-[13px] font-medium">Gmail</p>
                    <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>App Password + IMAP. No OAuth needed.</p>
                  </div>
                  <button className="sf-toggle" data-active={String(gmailEnabled)} onClick={() => setGmailEnabled(!gmailEnabled)} />
                </div>

                <div className="p-4 rounded-xl border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium">Outlook</p>
                      <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>OAuth required. Set up Azure AD app.</p>
                    </div>
                    <button className="sf-toggle" data-active={String(outlookEnabled)} onClick={() => setOutlookEnabled(!outlookEnabled)} />
                  </div>
                  {outlookEnabled && (
                    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid var(--border-default)" }}>
                      <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                        <a href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-text)" }}>Register app in Azure</a> with Mail.Read permission
                      </p>
                      <input type="text" value={outlookClientId} onChange={(e) => setOutlookClientId(e.target.value)} className="sf-input text-[11px]" placeholder="Client ID" />
                      <input type="password" value={outlookSecret} onChange={(e) => setOutlookSecret(e.target.value)} className="sf-input text-[11px]" placeholder="Client Secret" />
                      <input type="text" value={outlookTenantId} onChange={(e) => setOutlookTenantId(e.target.value)} className="sf-input text-[11px]" placeholder="Tenant ID (default: common)" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setStep(2)} className="sf-btn sf-btn-secondary flex-1">Back</button>
                <button onClick={() => setStep(4)} className="sf-btn sf-btn-primary flex-1">Continue</button>
              </div>
            </div>
          )}

          {/* ━━━ Step 4: Finish ━━━ */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center mb-2">
                <h2 className="text-lg font-bold tracking-tight">Almost there</h2>
                <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>Set defaults and launch</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="sf-input">
                    <option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option>
                    <option value="GBP">GBP</option><option value="AED">AED</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>Remind before</label>
                  <select value={remindDays} onChange={(e) => setRemindDays(parseInt(e.target.value))} className="sf-input">
                    <option value="1">1 day</option><option value="3">3 days</option><option value="5">5 days</option><option value="7">7 days</option>
                  </select>
                </div>
              </div>

              {/* Summary */}
              <div className="sf-card p-4 space-y-2">
                <p className="text-[12px] font-semibold">Your setup</p>
                <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                  {[
                    ["Mode", setupMode === "individual" ? "Individual" : "Multi-user"],
                    ["Database", dbType === "sqlite" ? "SQLite (local)" : "PostgreSQL"],
                    ["AI", LLM_PROVIDERS.find((p) => p.id === provider)?.name || "—"],
                    ["Model", customModel || model || "—"],
                    ["Gmail", gmailEnabled ? "Enabled" : "Off"],
                    ["Outlook", outlookEnabled ? "Enabled" : "Off"],
                    ["Currency", currency],
                    ["Reminders", `${remindDays}d before`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-1">
                      <span style={{ color: "var(--text-tertiary)" }}>{k}:</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(3)} className="sf-btn sf-btn-secondary flex-1">Back</button>
                <button onClick={handleComplete} disabled={saving} className="sf-btn sf-btn-primary flex-1">
                  {saving ? "Setting up..." : "Launch Subflo"}
                </button>
              </div>
            </div>
          )}

          {/* Dev credit */}
          <div className="mt-8 text-center">
            <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              Built by <a href="https://huzefanalkhedawala.in" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-text)" }}>Huzefa Nalkheda Wala</a> &middot; Open source &middot; MIT
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
