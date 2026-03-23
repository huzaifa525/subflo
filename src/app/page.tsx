import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl" style={{ background: "rgba(12,12,14,0.8)", borderBottom: "1px solid var(--border-default)" }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: "linear-gradient(135deg, #635bff, #7a73ff)" }}>S</div>
            <span className="text-[15px] font-semibold tracking-tight">Subflo</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hidden sm:block text-[13px]" style={{ color: "var(--text-secondary)" }}>Features</a>
            <a href="#how" className="hidden sm:block text-[13px]" style={{ color: "var(--text-secondary)" }}>How it works</a>
            <a href="https://github.com/huzaifa525/subflo" target="_blank" rel="noopener noreferrer" className="hidden sm:block text-[13px]" style={{ color: "var(--text-secondary)" }}>GitHub</a>
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-[13px] px-3 py-1.5" style={{ color: "var(--text-secondary)" }}>Sign in</Link>
              <Link href="/register" className="text-[13px] px-4 py-1.5 rounded-lg font-medium text-white" style={{ background: "var(--accent)" }}>Get started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium mb-8" style={{ background: "var(--accent-muted)", color: "var(--accent-text)", border: "1px solid rgba(99,91,255,0.15)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--green)" }} />
            Open source &middot; Self-hosted &middot; Privacy-first
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] mb-5">
            Stop losing money to<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #635bff, #a5a0ff)" }}>
              forgotten subscriptions
            </span>
          </h1>

          <p className="text-[15px] sm:text-base leading-relaxed max-w-lg mx-auto mb-8" style={{ color: "var(--text-secondary)" }}>
            Subflo scans your Gmail and uses AI to auto-detect every recurring payment. Budget alerts, renewal calendar, family sharing — all in one dashboard.
          </p>

          <div className="flex items-center justify-center gap-3 mb-4">
            <Link href="/register" className="px-6 py-2.5 rounded-lg font-medium text-white text-[14px]" style={{ background: "linear-gradient(135deg, #635bff, #524ae0)" }}>
              Start tracking — free
            </Link>
            <a href="https://github.com/huzaifa525/subflo" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-lg font-medium text-[14px] flex items-center gap-2" style={{ border: "1px solid var(--border-active)", color: "var(--text-secondary)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              Star on GitHub
            </a>
          </div>

          <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>No credit card &middot; No bank linking &middot; Just email + AI</p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-5" style={{ background: "var(--bg-secondary)" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 tracking-tight">How it works</h2>
          <p className="text-center text-[14px] mb-12" style={{ color: "var(--text-tertiary)" }}>Three steps. Two minutes. Zero bank access needed.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Connect Gmail",
                desc: "Add your Gmail with an App Password. No OAuth app, no Google Cloud Console. Just a 16-character password from your Google settings.",
                detail: "Works with multiple accounts (personal + work). Scans last 90 days on first connect, then auto-scans every 24 hours.",
              },
              {
                step: "02",
                title: "AI detects payments",
                desc: "3-layer filter: IMAP subject search, 40+ regex patterns, then LLM confirmation. Only real receipts pass — marketing emails get rejected.",
                detail: "Uses your choice of LLM (Ollama local, Groq free, OpenRouter, OpenAI). Extracts service name, amount, billing cycle, payment method.",
              },
              {
                step: "03",
                title: "Track everything",
                desc: "Dashboard shows monthly spend, renewal calendar, budget alerts, health score. Get email reminders before renewals. Find cheaper alternatives.",
                detail: "Export to CSV/JSON. Share with family. Dark/light theme. Works on mobile.",
              },
            ].map((s) => (
              <div key={s.step} className="sf-card p-5 space-y-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold" style={{ background: "var(--accent-muted)", color: "var(--accent-text)" }}>{s.step}</div>
                <h3 className="text-[15px] font-semibold">{s.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.desc}</p>
                <p className="text-[11px] leading-relaxed pt-1" style={{ color: "var(--text-tertiary)", borderTop: "1px solid var(--border-default)", paddingTop: 8 }}>{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 tracking-tight">Everything you need</h2>
          <p className="text-center text-[14px] mb-12" style={{ color: "var(--text-tertiary)" }}>Built for people who subscribe to things and forget about them.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Gmail scanning", desc: "IMAP with App Password. Multiple accounts. Auto-scan every 24h. 3-layer payment filter.", color: "#635bff" },
              { title: "Live pricing", desc: "Aristocles API for 75+ services. Auto-registered. Country-aware. Monthly + yearly plans.", color: "#f5a623" },
              { title: "Smart analytics", desc: "Monthly trends, category donut chart, daily average, yearly projection. All with currency conversion.", color: "#e5484d" },
              { title: "Health score", desc: "A+ to F grade. Checks budget, missing dates, category concentration, yearly savings potential.", color: "#3b82f6" },
              { title: "Calendar", desc: "Monthly grid showing every renewal date. Navigate months. See amounts on each day.", color: "#6e56cf" },
              { title: "Budget alerts", desc: "Set monthly limit. Get warnings at 80%. Over-budget insight on dashboard.", color: "#e93d82" },
              { title: "Renewal reminders", desc: "Browser notifications + email reminders via SMTP. Uses your own Gmail. Configurable days-before.", color: "#00a2c7" },
              { title: "Cancel links", desc: "Direct links to cancellation pages for 30+ services. One click to Netflix cancel, Spotify cancel, etc.", color: "#30a46c" },
              { title: "Alternatives", desc: "Find cheaper alternatives via Aristocles API. Shows savings amount. Country-specific pricing.", color: "#f76b15" },
              { title: "Family sharing", desc: "Invite family members. See combined spend. Per-member breakdown. No shared passwords.", color: "#635bff" },
              { title: "Global search", desc: "Cmd+K to instantly search all subscriptions by name or category. Keyboard-first design.", color: "#3ecf8e" },
              { title: "Dark & light mode", desc: "Full theme support with system-level toggle. Looks great on desktop and mobile.", color: "#6e56cf" },
            ].map((f) => (
              <div key={f.title} className="p-4 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-default)" }}>
                <div className="w-2 h-2 rounded-full mb-3" style={{ background: f.color }} />
                <h3 className="text-[13px] font-semibold mb-1">{f.title}</h3>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-tertiary)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LLM Providers */}
      <section className="py-16 px-5" style={{ background: "var(--bg-secondary)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-2 tracking-tight">Works with any LLM</h2>
          <p className="text-[13px] mb-8" style={{ color: "var(--text-tertiary)" }}>Your data never leaves your infrastructure. Pick any OpenAI-compatible provider.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {["Ollama (local)", "OpenRouter", "Groq", "OpenAI", "Together AI", "Custom API"].map((p) => (
              <span key={p} className="px-4 py-2 rounded-lg text-[12px] font-medium" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="py-16 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-medium uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>Built with</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {["Next.js 16", "TypeScript", "Tailwind CSS 4", "Prisma 7", "SQLite", "PWA"].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">Start tracking today</h2>
          <p className="text-[14px] mb-6" style={{ color: "var(--text-tertiary)" }}>Free, open source, self-hosted. No subscriptions to track your subscriptions.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/register" className="px-6 py-2.5 rounded-lg font-medium text-white text-[14px]" style={{ background: "linear-gradient(135deg, #635bff, #524ae0)" }}>
              Create free account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-5" style={{ borderTop: "1px solid var(--border-default)" }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center text-white font-bold text-[9px]" style={{ background: "var(--accent)" }}>S</div>
            <span className="text-[12px] font-medium">Subflo</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            <a href="https://github.com/huzaifa525/subflo" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-text)" }}>GitHub</a>
            <span>&middot;</span>
            <span>MIT License</span>
            <span>&middot;</span>
            <a href="https://huzefanalkhedawala.in" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-text)" }}>Huzefa Nalkheda Wala</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
