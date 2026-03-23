import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { processReminders } from "@/lib/email/send-reminder";
import { scanGmailSubscriptions } from "@/lib/email/gmail-imap";
import { extractJSON } from "@/lib/llm/client";
import { EMAIL_EXTRACTION_PROMPT } from "@/lib/llm/prompts";
import { mapServiceName, mapFromEmailSender } from "@/lib/service-mapper";

// Background auto-scan if last scan > 24 hours
async function autoScanIfNeeded(userId: string) {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings?.gmailEnabled) return;

  // Check last scan time
  const latestAccount = await prisma.gmailAccount.findFirst({
    where: { userId },
    orderBy: { lastScanAt: "desc" },
  });

  if (!latestAccount) return;

  const lastScan = latestAccount.lastScanAt?.getTime() || 0;
  const hoursSinceLastScan = (Date.now() - lastScan) / (1000 * 60 * 60);

  if (hoursSinceLastScan < 24) return; // Already scanned today

  console.log(`[AutoScan] Last scan was ${Math.round(hoursSinceLastScan)}h ago, running background scan`);

  try {
    const { emails } = await scanGmailSubscriptions(userId);
    let found = 0;

    for (const email of emails.slice(0, 20)) {
      const existing = await prisma.emailRecord.findFirst({
        where: { userId, messageId: email.id, provider: "gmail" },
      });
      if (existing?.processed) continue;
      if (existing) await prisma.emailRecord.delete({ where: { id: existing.id } });

      try {
        const prompt = `Subject: ${email.subject}\nFrom: ${email.from}\nDate: ${email.date}\n\nBody:\n${email.body}`;
        const parsed = await extractJSON<{
          is_subscription: boolean; service_name: string | null; amount: number | null;
          currency: string | null; billing_cycle: string | null; category: string | null;
        }>(prompt, EMAIL_EXTRACTION_PROMPT, userId);

        await prisma.emailRecord.create({
          data: {
            userId, messageId: email.id, provider: "gmail",
            subject: email.subject, from: email.from,
            parsedData: JSON.stringify(parsed),
            processed: parsed.is_subscription && !!parsed.amount,
            receivedAt: email.date ? new Date(email.date) : undefined,
          },
        });

        // Auto-add new subscriptions
        if (parsed.is_subscription && parsed.amount && parsed.service_name) {
          // Map to clean name
          const mapped = mapServiceName(parsed.service_name) || mapFromEmailSender(email.from);
          const cleanName = mapped?.name || parsed.service_name;

          const existingSub = await prisma.subscription.findFirst({
            where: { userId, serviceName: cleanName, status: { not: "cancelled" } },
          });
          if (!existingSub) {
            await prisma.subscription.create({
              data: {
                userId,
                serviceName: cleanName,
                amount: parsed.amount,
                currency: parsed.currency || "INR",
                billingCycle: parsed.billing_cycle || "monthly",
                category: mapped?.category || parsed.category || null,
                website: mapped?.website || email.website || null,
                source: "email",
                nextRenewal: calculateNextRenewal(parsed.billing_cycle, email.date),
              },
            });
            found++;
            console.log(`[AutoScan] Auto-added: ${parsed.service_name} ${parsed.currency}${parsed.amount}`);
          }
        }
      } catch { continue; }
    }
    if (found > 0) console.log(`[AutoScan] Added ${found} new subscriptions`);
  } catch (err) {
    console.error("[AutoScan] Failed:", err instanceof Error ? err.message : err);
  }
}

function calculateNextRenewal(cycle: string | null, emailDate: string | null): Date {
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
  return next;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const daysBefore = settings?.remindDaysBefore || 3;

  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() + daysBefore);

  const subs = await prisma.subscription.findMany({
    where: { userId, status: "active", nextRenewal: { lte: windowEnd, gte: new Date() } },
    orderBy: { nextRenewal: "asc" },
  });

  // Background tasks (non-blocking)
  processReminders().catch(() => {});
  autoScanIfNeeded(userId).catch(() => {});

  return NextResponse.json({
    notifications: subs.map((s) => ({
      id: s.id,
      serviceName: s.serviceName,
      amount: s.amount,
      currency: s.currency,
      nextRenewal: s.nextRenewal?.toISOString(),
      daysUntil: Math.ceil(((s.nextRenewal?.getTime() || 0) - Date.now()) / 86400000),
    })),
    count: subs.length,
  });
}
