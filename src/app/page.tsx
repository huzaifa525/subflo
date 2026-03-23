import Link from "next/link";

const features = [
  { icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M1 4l7 5 7-5M1 4v8a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2H3a2 2 0 00-2 2z" stroke="currentColor" strokeWidth="1.3"/></svg>, title: "Email scanning", desc: "Connect multiple Gmail accounts. AI finds subscription receipts automatically." },
  { icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="3" y="1" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="12" r="1" fill="currentColor"/></svg>, title: "SMS detection", desc: "Share bank SMS from your phone. Detects UPI, card, and net banking payments." },
  { icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, title: "Any LLM provider", desc: "Ollama, OpenRouter, Groq, OpenAI. Your data, your model, your rules." },
  { icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M3 13V8M7 13V5M11 13V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, title: "Spending analytics", desc: "Category breakdown, monthly trends, budget tracking, health score." },
  { icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1 7h14M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, title: "Calendar view", desc: "See all renewal dates at a glance. Never miss a payment or trial expiry." },
  { icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="11" cy="6" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1 14c0-2.5 2-4.5 5-4.5s5 2 5 4.5" stroke="currentColor" strokeWidth="1.3"/></svg>, title: "Family dashboard", desc: "Share and track combined spending across family members." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <nav className="px-4 md:px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-white font-semibold text-xs" style={{ background: "var(--accent)" }}>S</div>
          <span className="text-sm font-semibold tracking-tight">Subflo</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="sf-btn sf-btn-ghost text-xs">Sign in</Link>
          <Link href="/register" className="sf-btn sf-btn-primary text-xs">Get started</Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 md:px-6">
        <div className="max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ background: "var(--accent-muted)", color: "var(--accent-text)" }}>
            <svg width="8" height="8" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="4" fill="currentColor"/></svg>
            Open source &middot; Self-hosted &middot; LLM-powered
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
            Know where your<br /><span style={{ color: "var(--accent)" }}>money goes</span>
          </h1>

          <p className="text-sm md:text-[15px] leading-relaxed max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
            AI-powered subscription tracker. Scans your emails and SMS to auto-detect recurring payments. Budget alerts, family sharing, and 38+ services built in.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register" className="sf-btn sf-btn-primary">Start tracking — it&apos;s free</Link>
            <a href="https://github.com/huzaifa525/subflo" target="_blank" rel="noopener noreferrer" className="sf-btn sf-btn-secondary">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              GitHub
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-12 text-left">
            {features.map((f) => (
              <div key={f.title} className="sf-card p-4">
                <div className="mb-2.5" style={{ color: "var(--accent-text)" }}>{f.icon}</div>
                <h3 className="text-[13px] font-semibold mb-1">{f.title}</h3>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-tertiary)" }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 pt-6 flex-wrap text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            <span>Next.js</span><span>&middot;</span><span>SQLite</span><span>&middot;</span><span>Prisma</span><span>&middot;</span><span>TypeScript</span><span>&middot;</span><span>Tailwind</span><span>&middot;</span><span>PWA</span>
          </div>
        </div>
      </main>

      <footer className="px-4 md:px-6 py-4 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        Built by <a href="https://huzefanalkhedawala.in" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-text)" }}>Huzefa Nalkheda Wala</a> &middot; MIT License &middot; <a href="https://github.com/huzaifa525/subflo" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-text)" }}>Source</a>
      </footer>
    </div>
  );
}
