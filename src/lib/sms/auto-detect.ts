import { prisma } from "../db";

interface RecurringPattern {
  merchant: string;
  avgAmount: number;
  currency: string;
  count: number;
  frequency: "monthly" | "weekly" | "yearly" | "unknown";
  lastDate: string;
}

// Analyze SMS records for recurring patterns
export async function detectRecurringFromSMS(userId: string): Promise<RecurringPattern[]> {
  const records = await prisma.sMSRecord.findMany({
    where: { userId, processed: true },
    orderBy: { createdAt: "desc" },
  });

  // Group by merchant
  const groups = new Map<string, { amounts: number[]; dates: Date[]; currency: string }>();

  for (const r of records) {
    if (!r.parsedMerchant || !r.parsedAmount) continue;
    const key = r.parsedMerchant.toLowerCase().replace(/[^a-z0-9]/g, "");
    const existing = groups.get(key) || { amounts: [], dates: [], currency: r.parsedCurrency || "INR" };
    existing.amounts.push(r.parsedAmount);
    if (r.parsedDate) existing.dates.push(r.parsedDate);
    groups.set(key, existing);
  }

  const patterns: RecurringPattern[] = [];

  for (const [, data] of groups) {
    if (data.amounts.length < 2) continue; // Need 2+ transactions

    const avg = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;

    // Check if amounts are similar (within 20%)
    const similar = data.amounts.every((a) => Math.abs(a - avg) / avg < 0.2);
    if (!similar) continue;

    // Detect frequency from date gaps
    let frequency: RecurringPattern["frequency"] = "unknown";
    if (data.dates.length >= 2) {
      data.dates.sort((a, b) => a.getTime() - b.getTime());
      const gaps: number[] = [];
      for (let i = 1; i < data.dates.length; i++) {
        gaps.push((data.dates[i].getTime() - data.dates[i - 1].getTime()) / 86400000);
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      if (avgGap >= 25 && avgGap <= 35) frequency = "monthly";
      else if (avgGap >= 5 && avgGap <= 9) frequency = "weekly";
      else if (avgGap >= 350 && avgGap <= 380) frequency = "yearly";
    }

    const merchant = records.find((r) => r.parsedMerchant?.toLowerCase().replace(/[^a-z0-9]/g, "") === arguments[0])?.parsedMerchant || "Unknown";

    patterns.push({
      merchant,
      avgAmount: Math.round(avg * 100) / 100,
      currency: data.currency,
      count: data.amounts.length,
      frequency,
      lastDate: data.dates.length > 0 ? data.dates[data.dates.length - 1].toISOString() : "",
    });
  }

  return patterns.sort((a, b) => b.count - a.count);
}
