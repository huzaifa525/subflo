"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const LLM_PROVIDERS = [
  {
    id: "ollama",
    name: "Ollama (Local)",
    baseUrl: "http://localhost:11434/v1",
    needsKey: false,
    description: "Run models locally on your machine. Free, private.",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    needsKey: true,
    description: "Access 100+ models. Pay per token. Great variety.",
  },
  {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    needsKey: true,
    description: "Ultra-fast inference. Free tier available.",
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    needsKey: true,
    description: "GPT-4o, GPT-4o-mini. Paid.",
  },
  {
    id: "together",
    name: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    needsKey: true,
    description: "Open-source models. Free tier available.",
  },
  {
    id: "custom",
    name: "Custom Provider",
    baseUrl: "",
    needsKey: true,
    description: "Any OpenAI-compatible API endpoint.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: LLM Config
  const [provider, setProvider] = useState("ollama");
  const [baseUrl, setBaseUrl] = useState("http://localhost:11434/v1");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [customModel, setCustomModel] = useState("");

  // Step 2: Data Sources
  const [gmailEnabled, setGmailEnabled] = useState(false);
  const [outlookEnabled, setOutlookEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(true);

  // Step 3: Preferences
  const [currency, setCurrency] = useState("INR");
  const [remindDays, setRemindDays] = useState(3);

  function selectProvider(id: string) {
    const p = LLM_PROVIDERS.find((x) => x.id === id)!;
    setProvider(id);
    setBaseUrl(p.baseUrl);
    setApiKey("");
    setModel("");
    setModels([]);
  }

  async function handleFetchModels() {
    setFetchingModels(true);
    setFetchError("");
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, apiKey }),
      });
      const data = await res.json();
      if (data.models && data.models.length > 0) {
        setModels(data.models);
        setModel(data.models[0].id);
        setFetchError("");
      } else {
        setModels([]);
        setFetchError(
          provider === "ollama"
            ? "No models found. Is Ollama running? Try: ollama pull llama3.1:8b"
            : "No models found. Check your API key and try again."
        );
      }
    } catch {
      setModels([]);
      setFetchError("Connection failed. Check the URL and make sure the service is running.");
    }
    setFetchingModels(false);
  }

  async function handleComplete() {
    setSaving(true);
    const finalModel = customModel || model;

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        llmProvider: provider,
        llmBaseUrl: baseUrl,
        llmApiKey: apiKey,
        llmModel: finalModel,
        gmailEnabled,
        outlookEnabled,
        smsEnabled,
        currency,
        remindDaysBefore: remindDays,
      }),
    });

    if (!res.ok) {
      setSaving(false);
      return;
    }

    // Force session refresh so JWT picks up onboarded=true
    await updateSession();

    router.push("/dashboard");
    router.refresh();
  }

  const selectedProvider = LLM_PROVIDERS.find((p) => p.id === provider)!;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
            S
          </div>
          <h1 className="text-2xl font-bold">Set up Subflo</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Step {step} of 3
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full ${
                s <= step ? "bg-[var(--accent)]" : "bg-[var(--border)]"
              }`}
            />
          ))}
        </div>

        {/* Step 1: LLM Provider */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-semibold text-lg">AI Model Setup</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Choose your LLM provider. Subflo uses AI to parse emails, SMS,
                and extract subscription data.
              </p>
            </div>

            {/* Provider Selection */}
            <div className="grid grid-cols-2 gap-2">
              {LLM_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectProvider(p.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    provider === p.id
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)]/30"
                  }`}
                >
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {p.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Base URL (for custom) */}
            {provider === "custom" && (
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  API Base URL
                </label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://your-api.com/v1"
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            )}

            {/* API Key */}
            {selectedProvider.needsKey && (
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter your ${selectedProvider.name} API key`}
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            )}

            {/* Model Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">Model</label>
                <button
                  onClick={handleFetchModels}
                  disabled={fetchingModels || !baseUrl}
                  className="text-xs text-[var(--accent)] hover:underline disabled:opacity-50"
                >
                  {fetchingModels ? "Fetching..." : "Fetch models"}
                </button>
              </div>

              {models.length > 0 ? (
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="e.g. llama3.1:8b, meta-llama/llama-3.1-8b-instruct"
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              )}
              {fetchError && (
                <p className="text-xs text-[var(--warning)] mt-1">
                  {fetchError}
                </p>
              )}
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Click &quot;Fetch models&quot; to load available models, or type
                a model name manually.
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium text-sm hover:bg-[var(--accent-hover)] transition-colors"
            >
              Next: Data Sources
            </button>
          </div>
        )}

        {/* Step 2: Data Sources */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-semibold text-lg">Data Sources</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Choose how you want to track subscriptions. You can change these
                later.
              </p>
            </div>

            <div className="space-y-3">
              {/* Gmail Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
                <div>
                  <p className="font-medium text-sm">Gmail</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Scan Gmail for subscription receipts & renewal emails
                  </p>
                </div>
                <button
                  onClick={() => setGmailEnabled(!gmailEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    gmailEnabled ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      gmailEnabled ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Outlook Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
                <div>
                  <p className="font-medium text-sm">Outlook / Microsoft</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Scan Outlook inbox for subscription & billing emails
                  </p>
                </div>
                <button
                  onClick={() => setOutlookEnabled(!outlookEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    outlookEnabled ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      outlookEnabled ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* SMS Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
                <div>
                  <p className="font-medium text-sm">SMS Parsing</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Paste bank/UPI SMS to detect recurring payments
                  </p>
                </div>
                <button
                  onClick={() => setSmsEnabled(!smsEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    smsEnabled ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      smsEnabled ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Manual - always on */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] opacity-70">
                <div>
                  <p className="font-medium text-sm">Manual Entry</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Add subscriptions manually with smart suggestions
                  </p>
                </div>
                <div className="w-12 h-6 rounded-full bg-[var(--accent)] relative">
                  <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 translate-x-6" />
                </div>
              </div>
            </div>

            {gmailEnabled && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400">
                Gmail will require Google OAuth sign-in after setup.
              </div>
            )}

            {outlookEnabled && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400">
                Outlook will require Microsoft OAuth sign-in after setup.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--bg-hover)] transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium text-sm hover:bg-[var(--accent-hover)] transition-colors"
              >
                Next: Preferences
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-semibold text-lg">Preferences</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Set your default currency and reminder preferences.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="INR">INR (Indian Rupee)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
                <option value="AED">AED (UAE Dirham)</option>
                <option value="JPY">JPY (Japanese Yen)</option>
                <option value="CAD">CAD (Canadian Dollar)</option>
                <option value="AUD">AUD (Australian Dollar)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Remind me before renewal
              </label>
              <select
                value={remindDays}
                onChange={(e) => setRemindDays(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="1">1 day before</option>
                <option value="3">3 days before</option>
                <option value="5">5 days before</option>
                <option value="7">7 days before</option>
              </select>
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-2">
              <h3 className="font-medium text-sm">Setup Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
                <p>AI Provider: <span className="text-[var(--text)]">{LLM_PROVIDERS.find((p) => p.id === provider)?.name}</span></p>
                <p>Model: <span className="text-[var(--text)]">{customModel || model || "Not set"}</span></p>
                <p>Gmail: <span className={gmailEnabled ? "text-green-400" : "text-[var(--text-muted)]"}>{gmailEnabled ? "ON" : "OFF"}</span></p>
                <p>Outlook: <span className={outlookEnabled ? "text-green-400" : "text-[var(--text-muted)]"}>{outlookEnabled ? "ON" : "OFF"}</span></p>
                <p>SMS: <span className={smsEnabled ? "text-green-400" : "text-[var(--text-muted)]"}>{smsEnabled ? "ON" : "OFF"}</span></p>
                <p>Currency: <span className="text-[var(--text)]">{currency}</span></p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--bg-hover)] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium text-sm hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
              >
                {saving ? "Setting up..." : "Complete Setup"}
              </button>
            </div>
          </div>
        )}

        {/* Skip */}
        <button
          onClick={handleComplete}
          className="w-full text-center text-xs text-[var(--text-muted)] hover:text-white transition-colors"
        >
          Skip for now — I&apos;ll configure later
        </button>
      </div>
    </div>
  );
}
