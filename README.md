<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma" />
  <img src="https://img.shields.io/badge/SQLite-local-003B57?style=flat-square&logo=sqlite" />
  <img src="https://img.shields.io/badge/PWA-ready-5A0FC8?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

<h1 align="center">Subflo</h1>
<p align="center"><strong>AI-powered subscription tracker. Know where your money goes.</strong></p>
<p align="center">Open source &middot; Self-hosted &middot; Works with any LLM</p>

---

## What is Subflo?

Subflo scans your Gmail for payment receipts, parses bank SMS, and auto-detects recurring subscriptions. It uses any LLM (Ollama, OpenRouter, Groq, OpenAI) to extract service names, amounts, and billing cycles from your emails -- then tracks everything in one dashboard.

No bank API. No card linking. Just email scanning + AI.

## Features

**Subscription Tracking**
- Manual entry with 38+ pre-loaded services and multi-plan selection
- Live pricing from [Aristocles API](https://aristocles.com.au) (auto-registered, country-aware)
- Service logos via Clearbit + Google Favicon
- Payment method, card last 4, billing cycle, shared/family tracking
- Edit, pause, cancel, delete subscriptions

**Email Scanning**
- Gmail IMAP via App Password (no OAuth app creation needed)
- Multiple Gmail accounts with labels (Personal, Work)
- 3-layer payment detection: IMAP subject search -> regex scoring (40+ patterns) -> LLM confirmation
- Rejects marketing emails, welcome emails, promos -- only real payment receipts
- Auto-scan every 24 hours (background)
- Auto-adds new subscriptions from receipts
- 45+ service name mappings (fuzzy: "Claude by Anthropic" -> "Claude")

**SMS Parsing**
- Android: Share bank SMS directly to Subflo via PWA Share Target
- Manual paste with LLM extraction
- Recurring payment auto-detection from transaction patterns

**Analytics**
- Monthly/yearly spending with currency conversion (200+ currencies)
- Category breakdown with donut chart
- Monthly trend (bar chart)
- Subscription health score (A+ to F grade with tips)
- Spending insights (renewals this week, over-budget alerts, savings tips)
- Budget limits with warnings

**More**
- Calendar view -- renewal dates at a glance
- Browser notifications for upcoming renewals
- Email reminders via SMTP (uses same Gmail App Password)
- Global search (Cmd+K / Ctrl+K)
- Cheaper alternatives finder (Aristocles API)
- Direct cancellation links for 30+ services
- Receipt viewer (renders original email in iframe)
- Bank statement CSV import with AI detection
- Family dashboard -- combined spend across members
- Dark/light theme
- Mobile responsive with bottom tab navigation
- Export (JSON/CSV)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | SQLite via Prisma 7 |
| Auth | NextAuth.js (credentials) |
| UI | Tailwind CSS 4 + custom design system |
| LLM | OpenAI SDK (any compatible provider) |
| Email | ImapFlow + Mailparser (IMAP) + Nodemailer (SMTP) |
| Pricing | Aristocles API (auto-registered) |
| Currency | fawazahmed0/exchange-api |
| Logos | Clearbit Logo API + Google Favicon |
| PWA | Web manifest + Share Target |

## Quick Start

```bash
# Clone
git clone https://github.com/huzaifa525/subflo.git
cd subflo

# Install
npm install

# Setup database
npx prisma generate
npx prisma db push

# Configure (copy and edit)
cp .env.example .env

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and go through onboarding.

## Configuration

All configuration is done in the Settings page -- no `.env` editing needed for normal use.

### LLM Provider (required for email/SMS parsing)

| Provider | Base URL | Free? |
|----------|----------|-------|
| [Ollama](https://ollama.ai) | `http://localhost:11434/v1` | Yes (local) |
| [OpenRouter](https://openrouter.ai) | `https://openrouter.ai/api/v1` | Free models available |
| [Groq](https://groq.com) | `https://api.groq.com/openai/v1` | Free tier |
| [OpenAI](https://openai.com) | `https://api.openai.com/v1` | Paid |
| [Together](https://together.ai) | `https://api.together.xyz/v1` | Free tier |
| Any OpenAI-compatible | Custom URL | Varies |

### Gmail Setup (for email scanning)

1. Enable 2-Step Verification at [myaccount.google.com/security](https://myaccount.google.com/security)
2. Generate App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Enter email + app password in Settings -> Gmail

No OAuth app, no Google Cloud Console, no client IDs. Just an app password.

### Pricing API

Subflo auto-registers with [Aristocles API](https://aristocles.com.au) (free, 100 req/day) to fetch live subscription pricing. No manual setup needed.

## Architecture

```
                    +---------------------------+
                    |       Next.js 16 App       |
                    |  +--------+  +---------+   |
                    |  | Pages  |  | API     |   |
                    |  | (React)|  | Routes  |   |
                    |  +--------+  +---------+   |
                    |        |          |         |
                    |  +-----+----------+------+  |
                    |  |   Core Libraries       |  |
                    |  | LLM Client | Email     |  |
                    |  | Pricing    | Service   |  |
                    |  | Currency   | Mapper    |  |
                    |  +-----|------------------+  |
                    |        |                     |
                    |  +-----+------+              |
                    |  | Prisma 7   |              |
                    |  | (SQLite)   |              |
                    |  +------------+              |
                    +---------------------------+
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| GET/POST | `/api/subscriptions` | List/create subscriptions |
| GET/PATCH/DELETE | `/api/subscriptions/[id]` | Subscription CRUD |
| GET | `/api/analytics` | Spending analytics |
| GET | `/api/insights` | Smart spending insights |
| GET | `/api/health-score` | Subscription health score |
| GET | `/api/notifications` | Upcoming renewals + auto-scan |
| POST | `/api/email/scan` | Scan Gmail for receipts |
| GET/POST/DELETE | `/api/email/test` | Gmail account management |
| POST | `/api/sms/parse` | Parse SMS text |
| POST | `/api/pricing/lookup` | Live pricing (Aristocles) |
| GET | `/api/alternatives` | Cheaper alternatives |
| POST | `/api/reminders` | Process email reminders |
| POST | `/api/import` | CSV bank statement import |
| GET/POST | `/api/family` | Family member management |
| GET/PATCH | `/api/settings` | User settings |
| GET | `/api/currency` | Currency conversion |
| GET | `/api/export` | Export data (JSON/CSV) |

## Contributing

1. Fork the repo
2. Create a branch (`git checkout -b feature/xyz`)
3. Commit changes (`git commit -m 'feat: xyz'`)
4. Push (`git push origin feature/xyz`)
5. Open a Pull Request

## License

MIT

---

<p align="center">
  Built by <a href="https://huzefanalkhedawala.in">Huzefa Nalkheda Wala</a>
</p>
