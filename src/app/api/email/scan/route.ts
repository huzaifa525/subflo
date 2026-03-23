import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { scanGmailSubscriptions, type ScannedEmail } from "@/lib/email/gmail-imap";
import { extractJSON } from "@/lib/llm/client";
import { EMAIL_EXTRACTION_PROMPT } from "@/lib/llm/prompts";
import { prisma } from "@/lib/db";
import { searchServices } from "@/lib/pricing/database";

interface ParsedEmail {
  is_subscription: boolean;
  confidence: string | null;
  service_name: string | null;
  plan_name: string | null;
  amount: number | null;
  currency: string | null;
  billing_cycle: string | null;
  next_renewal: string | null;
  category: string | null;
  payment_method: string | null;
  card_last4: string | null;
  action: string | null;
  rejection_reason: string | null;
}

function mapToLocalService(name: string): { category: string; website: string } | null {
  if (!name) return null;
  const results = searchServices(name);
  if (results.length > 0) return { category: results[0].category, website: results[0].website };
  for (const word of name.toLowerCase().split(/\s+/)) {
    if (word.length < 3) continue;
    const partial = searchServices(word);
    if (partial.length > 0) return { category: partial[0].category, website: partial[0].website };
  }
  return null;
}

function calculateNextRenewal(cycle: string | null, emailDate: string | null): string | null {
  const base = emailDate ? new Date(emailDate) : new Date();
  const now = new Date();
  const next = new Date(base);
  let safety = 0;
  while (next <= now && safety < 50) {
    switch (cycle) {
      case "yearly": next.setFullYear(next.getFullYear() + 1); break;
      case "quarterly": next.setMonth(next.getMonth() + 3); break;
      case "weekly": next.setDate(next.getDate() + 7); break;
      default: next.setMonth(next.getMonth() + 1); break;
    }
    safety++;
  }
  return next.toISOString();
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { emails, error } = await scanGmailSubscriptions(userId);
  if (error) return NextResponse.json({ error, results: [], scanned: 0, subscriptions: 0 });
  if (emails.length === 0) return NextResponse.json({ results: [], scanned: 0, subscriptions: 0, message: "No billing emails found" });

  const results: {
    subject: string;
    from: string;
    date: string;
    website: string | null;
    htmlPreview: string;
    paymentScore?: number;
    parsed: ParsedEmail | null;
    localMatch: { category: string; website: string } | null;
    nextRenewal: string | null;
    error?: string;
  }[] = [];

  for (const email of emails.slice(0, 50)) {
    // Skip already processed
    // Only skip if ALREADY FOUND as subscription — re-process rejected ones
    const existing = await prisma.emailRecord.findFirst({
      where: { userId, messageId: email.id, provider: "gmail" },
    });
    if (existing?.processed) {
      console.log(`[Scan] SKIP (already tracked): ${email.subject.slice(0, 50)}`);
      continue;
    }
    // Delete old failed record to re-process
    if (existing) {
      await prisma.emailRecord.delete({ where: { id: existing.id } });
    }

    try {
      const prompt = `Subject: ${email.subject}\nFrom: ${email.from}\nDate: ${email.date}\nWebsite URLs found: ${email.urls.slice(0, 5).join(", ")}\n\nBody:\n${email.body}`;

      console.log(`[Scan] Parsing: ${email.subject.slice(0, 60)}`);
      const parsed = await extractJSON<ParsedEmail>(prompt, EMAIL_EXTRACTION_PROMPT, userId);
      console.log(`[Scan] Result: is_sub=${parsed.is_subscription} conf=${parsed.confidence} name=${parsed.service_name} amt=${parsed.amount} reason=${parsed.rejection_reason || "none"}`);

      const localMatch = parsed.service_name ? mapToLocalService(parsed.service_name) : null;
      if (localMatch && !parsed.category) parsed.category = localMatch.category;

      const website = email.website || localMatch?.website || null;

      const nextRenewal = parsed.is_subscription
        ? (parsed.next_renewal || calculateNextRenewal(parsed.billing_cycle, email.date))
        : null;

      await prisma.emailRecord.create({
        data: {
          userId,
          messageId: email.id,
          provider: "gmail",
          subject: email.subject,
          from: email.from,
          parsedData: JSON.stringify({ ...parsed, nextRenewal, website, html: email.html.slice(0, 3000) }),
          processed: parsed.is_subscription,
          receivedAt: email.date ? new Date(email.date) : undefined,
        },
      });

      // Include confirmed payments with amount
      if (parsed.is_subscription && parsed.amount) {
        results.push({
          subject: email.subject,
          from: email.from,
          date: email.date,
          website,
          htmlPreview: email.html.slice(0, 500),
          paymentScore: email.paymentScore,
          parsed,
          localMatch,
          nextRenewal,
        });
      }
    } catch (err) {
      results.push({
        subject: email.subject,
        from: email.from,
        date: email.date,
        website: email.website,
        htmlPreview: "",
        parsed: null,
        localMatch: null,
        nextRenewal: null,
        error: err instanceof Error ? err.message : "LLM failed",
      });
    }
  }

  // Deduplicate by service name — keep latest (most recent date) per service
  const deduped = new Map<string, typeof results[0]>();
  for (const r of results) {
    if (!r.parsed?.service_name) continue;
    const key = r.parsed.service_name.toLowerCase();
    const existing = deduped.get(key);
    if (!existing || new Date(r.date) > new Date(existing.date)) {
      deduped.set(key, r);
    }
  }
  const uniqueResults = Array.from(deduped.values());

  return NextResponse.json({
    scanned: emails.length,
    subscriptions: uniqueResults.length,
    results: uniqueResults,
  });
}
