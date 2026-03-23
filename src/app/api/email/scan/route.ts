import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { scanGmailSubscriptions } from "@/lib/email/gmail-imap";
import { extractJSON } from "@/lib/llm/client";
import { EMAIL_EXTRACTION_PROMPT } from "@/lib/llm/prompts";
import { prisma } from "@/lib/db";
import { searchServices } from "@/lib/pricing/database";

interface ParsedEmail {
  is_subscription: boolean;
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
}

// Map LLM-extracted service name to our local DB for category/website
function mapToLocalService(serviceName: string): { category: string; website: string } | null {
  if (!serviceName) return null;
  const results = searchServices(serviceName);
  if (results.length > 0) {
    return { category: results[0].category, website: results[0].website };
  }
  // Try partial match
  const words = serviceName.toLowerCase().split(/\s+/);
  for (const word of words) {
    if (word.length < 3) continue;
    const partial = searchServices(word);
    if (partial.length > 0) {
      return { category: partial[0].category, website: partial[0].website };
    }
  }
  return null;
}

// Calculate next renewal from billing cycle
function calculateNextRenewal(billingCycle: string | null, emailDate: string | null): string | null {
  const base = emailDate ? new Date(emailDate) : new Date();
  const now = new Date();
  let next = new Date(base);

  // Keep adding cycles until we're in the future
  const addCycle = () => {
    switch (billingCycle) {
      case "yearly": next.setFullYear(next.getFullYear() + 1); break;
      case "quarterly": next.setMonth(next.getMonth() + 3); break;
      case "weekly": next.setDate(next.getDate() + 7); break;
      default: next.setMonth(next.getMonth() + 1); break; // monthly default
    }
  };

  // Roll forward until next renewal is in the future
  let safety = 0;
  while (next <= now && safety < 50) {
    addCycle();
    safety++;
  }

  return next.toISOString();
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const { emails, error } = await scanGmailSubscriptions(userId);
  if (error) return NextResponse.json({ error, results: [] });
  if (emails.length === 0) {
    return NextResponse.json({ results: [], scanned: 0, subscriptions: 0, message: "No subscription emails found in the last 60 days" });
  }

  const results: {
    subject: string;
    from: string;
    date: string;
    parsed: ParsedEmail | null;
    localMatch: { category: string; website: string } | null;
    nextRenewal: string | null;
    error?: string;
  }[] = [];

  // Process up to 40 emails
  for (const email of emails.slice(0, 40)) {
    const existing = await prisma.emailRecord.findFirst({
      where: { userId, messageId: email.id, provider: "gmail" },
    });
    if (existing) continue;

    try {
      const prompt = `Subject: ${email.subject}\nFrom: ${email.from}\nDate: ${email.date}\n\nBody:\n${email.body}`;
      const parsed = await extractJSON<ParsedEmail>(prompt, EMAIL_EXTRACTION_PROMPT, userId);

      // Map to local DB
      const localMatch = parsed.service_name ? mapToLocalService(parsed.service_name) : null;
      if (localMatch && !parsed.category) {
        parsed.category = localMatch.category;
      }

      // Calculate next renewal
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
          parsedData: JSON.stringify({ ...parsed, nextRenewal, localMatch }),
          processed: parsed.is_subscription,
          receivedAt: email.date ? new Date(email.date) : undefined,
        },
      });

      if (parsed.is_subscription) {
        results.push({
          subject: email.subject,
          from: email.from,
          date: email.date,
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
        parsed: null,
        localMatch: null,
        nextRenewal: null,
        error: err instanceof Error ? err.message : "LLM parsing failed",
      });
    }
  }

  return NextResponse.json({
    scanned: emails.length,
    subscriptions: results.filter((r) => r.parsed?.is_subscription).length,
    results,
  });
}
