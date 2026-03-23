"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handleMouse = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
    };
    el.addEventListener("mousemove", handleMouse);
    return () => el.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#08080a", color: "#e4e4e7" }}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 w-full z-50" style={{ background: "rgba(8,8,10,0.7)", backdropFilter: "blur(20px) saturate(180%)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[1120px] mx-auto px-5 h-[54px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="6" fill="url(#lg)" />
              <path d="M7 10.5C7 8.567 8.567 7 10.5 7H13.5C15.433 7 17 8.567 17 10.5C17 12.433 15.433 14 13.5 14H10.5M7 13.5C7 15.433 8.567 17 10.5 17H13.5C15.433 17 17 15.433 17 13.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              <defs><linearGradient id="lg" x1="0" y1="0" x2="24" y2="24"><stop stopColor="#635bff" /><stop offset="1" stopColor="#4f46e5" /></linearGradient></defs>
            </svg>
            <span className="text-[15px] font-semibold tracking-[-0.02em]">Subflo</span>
          </Link>

          <div className="flex items-center gap-1">
            <a href="#how" className="hidden md:block px-3 py-1.5 text-[13px] rounded-md text-zinc-500 hover:text-zinc-300 transition-colors">How it works</a>
            <a href="#features" className="hidden md:block px-3 py-1.5 text-[13px] rounded-md text-zinc-500 hover:text-zinc-300 transition-colors">Features</a>
            <a href="https://github.com/huzaifa525/subflo" target="_blank" rel="noopener noreferrer" className="hidden md:block px-3 py-1.5 text-[13px] rounded-md text-zinc-500 hover:text-zinc-300 transition-colors">GitHub</a>
            <div className="w-px h-4 mx-2 bg-zinc-800 hidden md:block" />
            <Link href="/login" className="px-3 py-1.5 text-[13px] text-zinc-500 hover:text-zinc-300 transition-colors">Sign in</Link>
            <Link href="/register" className="ml-1 px-4 py-[6px] text-[13px] font-medium rounded-lg text-white transition-all hover:shadow-[0_0_20px_rgba(99,91,255,0.3)]" style={{ background: "linear-gradient(180deg, #7a73ff 0%, #5b54e0 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 1px 3px rgba(0,0,0,0.4)" }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative pt-32 sm:pt-40 pb-28 px-5 overflow-hidden" style={{ ["--mx" as string]: "50%", ["--my" as string]: "50%" }}>
        {/* Interactive glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(600px circle at var(--mx) var(--my), rgba(99,91,255,0.07), transparent 60%)" }} />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none opacity-40" style={{ background: "radial-gradient(ellipse, rgba(99,91,255,0.15), transparent 70%)", filter: "blur(60px)" }} />

        <div className="relative max-w-[640px] mx-auto text-center">
          {/* Status pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium mb-8 border border-zinc-800/80" style={{ background: "rgba(255,255,255,0.02)" }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-zinc-400">Open source</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400">Self-hosted</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400">Privacy-first</span>
          </div>

          <h1 className="text-[clamp(2.2rem,7vw,4rem)] font-bold leading-[1.05] tracking-[-0.04em] mb-6">
            Your subscriptions,
            <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #a5a0ff 0%, #635bff 50%, #4f46e5 100%)" }}>
              finally under control
            </span>
          </h1>

          <p className="text-[16px] leading-[1.7] text-zinc-400 max-w-[440px] mx-auto mb-9">
            AI scans your Gmail for every recurring charge. Budget alerts before you overspend. Renewal calendar so nothing slips. One dashboard for everything.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
            <Link href="/register" className="w-full sm:w-auto group relative px-7 py-3 rounded-xl text-[14px] font-semibold text-white overflow-hidden transition-all" style={{ background: "linear-gradient(180deg, #7a73ff 0%, #5b54e0 100%)", boxShadow: "0 4px 24px rgba(99,91,255,0.35), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
              <span className="relative z-10">Start tracking — free</span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(180deg, #8b85ff 0%, #635bff 100%)" }} />
            </Link>
            <a href="https://github.com/huzaifa525/subflo" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-6 py-3 rounded-xl text-[14px] font-medium flex items-center justify-center gap-2.5 text-zinc-400 border border-zinc-800 hover:border-zinc-600 hover:text-zinc-200 transition-all" style={{ background: "rgba(255,255,255,0.02)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              Star on GitHub
            </a>
          </div>

          <p className="text-[11px] text-zinc-600 tracking-[0.05em]">No credit card &nbsp;&middot;&nbsp; No bank API &nbsp;&middot;&nbsp; Just Gmail + AI</p>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="max-w-[1120px] mx-auto px-5"><div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(99,91,255,0.2), transparent)" }} /></div>

      {/* ── How it works ── */}
      <section id="how" className="py-28 px-5">
        <div className="max-w-[960px] mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3 text-center" style={{ color: "#635bff" }}>How it works</p>
          <h2 className="text-[clamp(1.5rem,4vw,2.4rem)] font-bold text-center tracking-[-0.03em] mb-5">
            Three steps. Two minutes.
          </h2>
          <p className="text-center text-[15px] text-zinc-500 mb-16 max-w-sm mx-auto">No bank linking. No OAuth apps. Just a Google App Password.</p>

          <div className="space-y-px rounded-2xl overflow-hidden border border-zinc-800/60">
            {[
              { n: "01", t: "Connect your Gmail", d: "Generate an App Password from Google settings — takes 30 seconds. Paste it in Subflo. Done. Works with multiple accounts.", s: "Scans last 90 days on first connect. Auto-scans every 24 hours after." },
              { n: "02", t: "AI finds your subscriptions", d: "3-layer detection pipeline: IMAP search catches receipts, 40+ regex patterns score payment likelihood, your LLM confirms and extracts details.", s: "Extracts: service name, amount, billing cycle, payment method, card last 4 digits." },
              { n: "03", t: "Track, optimize, save", d: "Dashboard shows where every rupee goes. Calendar shows when things renew. Budget alerts warn before you overspend. Find cheaper alternatives.", s: "Email reminders via SMTP. Family sharing. CSV export. Dark/light theme." },
            ].map((item, i) => (
              <div key={item.n} className="p-7 sm:p-9 flex flex-col sm:flex-row gap-6 sm:gap-10" style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.008)" }}>
                <div className="shrink-0">
                  <span className="text-[40px] sm:text-[56px] font-bold leading-none tracking-[-0.04em]" style={{ color: "rgba(99,91,255,0.15)" }}>{item.n}</span>
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em]">{item.t}</h3>
                  <p className="text-[14px] leading-[1.7] text-zinc-400">{item.d}</p>
                  <p className="text-[12px] leading-[1.6] text-zinc-600 pt-1">{item.s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-28 px-5" style={{ background: "rgba(255,255,255,0.01)" }}>
        <div className="max-w-[1120px] mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3 text-center" style={{ color: "#635bff" }}>Features</p>
          <h2 className="text-[clamp(1.5rem,4vw,2.4rem)] font-bold text-center tracking-[-0.03em] mb-5">Everything. Nothing extra.</h2>
          <p className="text-center text-[15px] text-zinc-500 mb-16 max-w-md mx-auto">Built for people who subscribe to things and forget about them.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px rounded-2xl overflow-hidden border border-zinc-800/60">
            {[
              ["Gmail Scanning", "IMAP with App Password. Multiple accounts. 3-layer payment filter. Auto-scans every 24 hours."],
              ["Any LLM Provider", "Ollama local, Groq free, OpenRouter, OpenAI, Together — or any OpenAI-compatible endpoint."],
              ["Live Pricing", "75+ services via Aristocles API. Country-aware. Monthly and yearly plans. Auto-registered."],
              ["Spending Analytics", "Monthly trends, category donut chart, daily average, yearly projection. 200+ currency conversion."],
              ["Renewal Calendar", "Monthly grid with amounts on each day. Navigate months. Never miss a renewal."],
              ["Health Score", "A+ to F grade. Budget adherence, missing dates, category concentration, savings potential."],
              ["Budget Alerts", "Set monthly limit. Warnings at 80%. Over-budget insights on dashboard."],
              ["Email Reminders", "SMTP via your own Gmail. Browser notifications. Configurable days-before."],
              ["Cancel Links", "Direct cancellation pages for 30+ services. Netflix, Spotify, ChatGPT — one click."],
              ["Cheaper Alternatives", "Country-specific pricing via Aristocles API. Shows exact savings amount."],
              ["Family Dashboard", "Invite members. Combined spend view. Per-person breakdown. No shared passwords."],
              ["Search & Themes", "Cmd+K global search. Dark and light modes. Mobile-first responsive design."],
            ].map(([title, desc], i) => (
              <div key={title} className="group p-6 transition-colors hover:bg-white/[0.02]" style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.012)" : "rgba(255,255,255,0.006)" }}>
                <h3 className="text-[14px] font-semibold tracking-[-0.01em] mb-2 group-hover:text-white transition-colors">{title}</h3>
                <p className="text-[12px] leading-[1.65] text-zinc-500 group-hover:text-zinc-400 transition-colors">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LLM providers ── */}
      <section className="py-24 px-5">
        <div className="max-w-[720px] mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: "#635bff" }}>Bring your own model</p>
          <h2 className="text-xl font-bold tracking-[-0.02em] mb-3">Your data never leaves your machine</h2>
          <p className="text-[14px] text-zinc-500 mb-12">Pick any OpenAI-compatible LLM provider. Run locally with Ollama for complete privacy.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { name: "Ollama", tag: "local" },
              { name: "OpenRouter", tag: "100+ models" },
              { name: "Groq", tag: "free tier" },
              { name: "OpenAI", tag: "GPT-4o" },
              { name: "Together", tag: "open source" },
              { name: "Custom", tag: "any endpoint" },
            ].map((p) => (
              <div key={p.name} className="group px-4 py-3.5 rounded-xl border border-zinc-800/60 hover:border-[#635bff]/40 transition-all cursor-default" style={{ background: "rgba(255,255,255,0.015)" }}>
                <span className="text-[13px] font-medium block">{p.name}</span>
                <span className="text-[10px] text-zinc-600 group-hover:text-[#a5a0ff] transition-colors">{p.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech ── */}
      <div className="py-10 px-5">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {["Next.js 16", "TypeScript", "Tailwind 4", "Prisma 7", "SQLite / Postgres", "PWA"].map((t, i) => (
            <span key={t} className="flex items-center gap-3">
              <span className="text-[11px] font-medium text-zinc-600">{t}</span>
              {i < 5 && <span className="text-zinc-800">&middot;</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <section className="py-28 px-5 relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(99,91,255,0.06), transparent 50%)" }} />
        <div className="max-w-md mx-auto text-center relative z-10">
          <h2 className="text-[clamp(1.6rem,4vw,2.5rem)] font-bold tracking-[-0.03em] mb-4 leading-[1.1]">
            Stop guessing.
            <br />
            Start tracking.
          </h2>
          <p className="text-[15px] text-zinc-500 mb-8">Free, open source, self-hosted. Zero subscriptions to track your subscriptions.</p>
          <Link href="/register" className="group relative inline-flex px-8 py-3.5 rounded-xl text-[15px] font-semibold text-white overflow-hidden transition-all" style={{ background: "linear-gradient(180deg, #7a73ff 0%, #5b54e0 100%)", boxShadow: "0 4px 32px rgba(99,91,255,0.3), inset 0 1px 0 rgba(255,255,255,0.12)" }}>
            <span className="relative z-10">Create free account</span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(180deg, #8b85ff 0%, #635bff 100%)" }} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-5 border-t border-zinc-900">
        <div className="max-w-[1120px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-[11px] text-zinc-600">
            <span className="font-medium text-zinc-400">Subflo</span>
            <span>MIT License</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-zinc-600">
            <a href="https://github.com/huzaifa525/subflo" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">GitHub</a>
            <span className="text-zinc-800">/</span>
            <a href="https://huzefanalkhedawala.in" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">Huzefa Nalkheda Wala</a>
            <span className="text-zinc-800">/</span>
            <a href="https://linkedin.com/in/huzefanalkheda" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
