import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-white font-semibold text-xs" style={{ background: "var(--accent)" }}>S</div>
          <span className="text-sm font-semibold tracking-tight">Subflo</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="sf-btn sf-btn-ghost text-xs">Sign in</Link>
          <Link href="/register" className="sf-btn sf-btn-primary text-xs">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ background: "var(--accent-muted)", color: "var(--accent-text)" }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" fill="currentColor"/></svg>
            Open source &middot; Self-hosted &middot; LLM-powered
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
            Know where your
            <br />
            <span style={{ color: "var(--accent)" }}>money goes</span>
          </h1>

          <p className="text-[15px] leading-relaxed max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
            AI-powered subscription tracker. Parses emails and SMS to auto-detect recurring payments. Works with any LLM provider.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link href="/register" className="sf-btn sf-btn-primary">Start tracking</Link>
            <a href="https://github.com/huzaifa525/subflo" target="_blank" rel="noopener noreferrer" className="sf-btn sf-btn-secondary">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              GitHub
            </a>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 pt-12 text-left">
            {[
              { icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M1 4l7 5 7-5M1 4v8a2 2 0 002 2h10a2 2 0 002-2V4M1 4a2 2 0 012-2h10a2 2 0 012 2" stroke="currentColor" strokeWidth="1.3"/></svg>, title: "Email parsing", desc: "Gmail & Outlook. AI extracts subscription receipts automatically." },
              { icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="3" y="1" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="12" r="1" fill="currentColor"/></svg>, title: "SMS detection", desc: "Paste bank SMS. Detects UPI, card & netbanking recurring payments." },
              { icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, title: "Any LLM", desc: "Ollama, OpenRouter, Groq, OpenAI. Your data, your model, your rules." },
            ].map((f) => (
              <div key={f.title} className="sf-card p-4">
                <div className="mb-2.5" style={{ color: "var(--accent-text)" }}>{f.icon}</div>
                <h3 className="text-[13px] font-semibold mb-1">{f.title}</h3>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-tertiary)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        Built by <a href="https://huzefanalkhedawala.in" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-text)" }}>Huzefa Nalkheda Wala</a> &middot; MIT License
      </footer>
    </div>
  );
}
