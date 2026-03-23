"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function InboxPage() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [results, setResults] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [tracked, setTracked] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<"share" | "paste">("share");

  // Auto-detect shared text from Android Share Target
  useEffect(() => {
    const shared = searchParams.get("text");
    if (shared) {
      setMessages((prev) => [...prev, shared]);
      setMode("share");
    }
  }, [searchParams]);

  function addMessage() {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, input.trim()]);
    setInput("");
  }

  function removeMessage(i: number) {
    setMessages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function parseAll() {
    if (messages.length === 0) return;
    setLoading(true);
    setTracked(new Set());
    const res = await fetch("/api/sms/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json();
    setResults(data.parsed || []);
    setLoading(false);
  }

  async function parsePasted() {
    if (!input.trim()) return;
    setLoading(true);
    setTracked(new Set());
    const msgs = input.split("\n").map((m) => m.trim()).filter(Boolean);
    const res = await fetch("/api/sms/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs }),
    });
    const data = await res.json();
    setResults(data.parsed || []);
    setLoading(false);
  }

  async function trackItem(parsed: Record<string, unknown>, index: number) {
    await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceName: parsed.merchant || "Unknown",
        amount: parsed.amount || 0,
        currency: (parsed.currency as string) || "INR",
        billingCycle: "monthly",
        source: "sms",
      }),
    });
    setTracked((prev) => new Set(prev).add(index));
  }

  const successCount = results.filter((r) => !(r as Record<string, unknown>).error).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Inbox</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Detect subscriptions from bank SMS</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-0.5 rounded-lg w-fit" style={{ background: "var(--bg-tertiary)" }}>
        {([
          { id: "share" as const, label: "Share from phone", icon: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="3" y="1" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="12" r="1" fill="currentColor"/></svg> },
          { id: "paste" as const, label: "Paste SMS", icon: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M5 2h6v2H5zM3 4h10v10H3z" stroke="currentColor" strokeWidth="1.3"/></svg> },
        ]).map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all"
            style={{
              background: mode === m.id ? "var(--bg-secondary)" : "transparent",
              color: mode === m.id ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: mode === m.id ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Share mode — SMS queue */}
      {mode === "share" && (
        <div className="space-y-4">
          {/* How it works */}
          <div className="sf-card p-4 space-y-3">
            <h3 className="text-[13px] font-semibold">How it works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: "1", title: "Open SMS app", desc: "Find a bank transaction SMS" },
                { step: "2", title: "Share to Subflo", desc: "Long press → Share → Subflo" },
                { step: "3", title: "Auto-parsed", desc: "AI extracts merchant, amount, date" },
              ].map((s) => (
                <div key={s.step} className="flex gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "var(--accent-muted)", color: "var(--accent-text)" }}>{s.step}</div>
                  <div>
                    <p className="text-[12px] font-medium">{s.title}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message queue */}
          {messages.length > 0 && (
            <div className="sf-card">
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border-default)" }}>
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{messages.length} SMS queued</span>
                <button onClick={parseAll} disabled={loading} className="sf-btn sf-btn-primary text-xs">
                  {loading ? "Parsing..." : "Parse all"}
                </button>
              </div>
              {messages.map((msg, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center justify-between border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <p className="text-[12px] font-mono truncate flex-1 mr-3" style={{ color: "var(--text-secondary)" }}>{msg}</p>
                  <button onClick={() => removeMessage(i)} className="sf-btn sf-btn-ghost p-1" style={{ color: "var(--text-tertiary)" }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick add manually */}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMessage()}
              placeholder="Or type/paste a single SMS here..."
              className="sf-input flex-1"
            />
            <button onClick={addMessage} disabled={!input.trim()} className="sf-btn sf-btn-secondary text-xs">Add</button>
          </div>
        </div>
      )}

      {/* Paste mode — bulk paste */}
      {mode === "paste" && (
        <div className="sf-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Paste SMS messages</span>
            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>One per line</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder={"Rs.299.00 debited from A/c XX1234 to NETFLIX\nUPI: Rs 149 paid to SPOTIFY INDIA\nINR 499 spent on card ending 4532 at HOTSTAR"}
            className="sf-input font-mono text-[12px] leading-relaxed resize-none"
            style={{ minHeight: 120 }}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] tabular-nums" style={{ color: "var(--text-tertiary)" }}>
              {input.split("\n").filter((l) => l.trim()).length} message{input.split("\n").filter((l) => l.trim()).length !== 1 ? "s" : ""}
            </span>
            <button onClick={parsePasted} disabled={loading || !input.trim()} className="sf-btn sf-btn-primary text-xs">
              {loading ? "Parsing..." : "Parse with AI"}
            </button>
          </div>
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && (
        <div className="sf-card overflow-x-auto">
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border-default)" }}>
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Parsed transactions</span>
            {successCount > 0 && <span className="sf-badge sf-badge-green">{successCount} found</span>}
          </div>
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[11px] font-medium uppercase tracking-wider border-b min-w-[600px]" style={{ color: "var(--text-tertiary)", borderColor: "var(--border-default)" }}>
            <span className="col-span-3">Merchant</span>
            <span className="col-span-2">Date</span>
            <span className="col-span-2">Bank</span>
            <span className="col-span-1">Type</span>
            <span className="col-span-2 text-right">Amount</span>
            <span className="col-span-2 text-right">Action</span>
          </div>
          {results.map((r, i) => {
            const p = r as Record<string, unknown>;
            if (p.error) return (
              <div key={i} className="px-4 py-2.5 text-[12px] border-b" style={{ borderColor: "var(--border-subtle)", color: "var(--red)" }}>
                Failed: {(p.text as string)?.slice(0, 60)}
              </div>
            );
            return (
              <div key={i} className="grid grid-cols-12 gap-2 items-center px-4 py-2.5 border-b min-w-[600px]" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="col-span-3"><p className="text-[13px] font-medium truncate">{(p.merchant as string) || "Unknown"}</p></div>
                <div className="col-span-2"><span className="text-[12px] tabular-nums" style={{ color: "var(--text-secondary)" }}>{(p.date as string) || "—"}</span></div>
                <div className="col-span-2"><span className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>{(p.bank as string) || "—"}</span></div>
                <div className="col-span-1"><span className={`sf-badge ${(p.type as string) === "credit" ? "sf-badge-green" : "sf-badge-red"}`}>{(p.type as string) || "debit"}</span></div>
                <div className="col-span-2 text-right"><span className="text-[13px] font-medium tabular-nums">{(p.currency as string) || "INR"} {(p.amount as number) || 0}</span></div>
                <div className="col-span-2 text-right">
                  {tracked.has(i) ? <span className="sf-badge sf-badge-green">Tracked</span> : (
                    <button onClick={() => trackItem(p, i)} className="sf-btn sf-btn-secondary text-[11px] py-1 px-2.5">+ Track</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && messages.length === 0 && !loading && mode === "share" && (
        <div className="sf-card px-4 py-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center" style={{ background: "var(--accent-muted)" }}>
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none" style={{ color: "var(--accent-text)" }}>
              <rect x="3" y="1" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M6 5h4M6 7.5h4M6 10h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>No SMS yet</p>
          <p className="text-[11px] max-w-xs mx-auto leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
            On Android: open your SMS app, find a bank transaction, tap Share, and select Subflo.
            The message will appear here for AI parsing.
          </p>
        </div>
      )}
    </div>
  );
}
