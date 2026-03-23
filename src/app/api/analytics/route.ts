import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { convert } from "@/lib/currency";

async function toUserCurrency(amount: number, from: string, userCurrency: string): Promise<number> {
  if (from.toLowerCase() === userCurrency.toLowerCase()) return amount;
  try {
    return await convert(amount, from, userCurrency);
  } catch {
    return amount; // fallback: return unconverted
  }
}

function getMonthlyEquivalent(amount: number, cycle: string): number {
  switch (cycle) {
    case "yearly": return amount / 12;
    case "quarterly": return amount / 3;
    case "weekly": return amount * 4.33;
    default: return amount;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  // Get user's preferred currency
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const userCurrency = settings?.currency || "INR";

  const subscriptions = await prisma.subscription.findMany({
    where: { userId, status: "active" },
  });

  // Calculate monthly totals with currency conversion
  let totalMonthly = 0;
  const categoryMap = new Map<string, { amount: number; count: number }>();

  for (const sub of subscriptions) {
    const monthlyAmount = getMonthlyEquivalent(sub.amount, sub.billingCycle);
    const converted = await toUserCurrency(monthlyAmount, sub.currency, userCurrency);

    totalMonthly += converted;

    const cat = sub.category || "other";
    const existing = categoryMap.get(cat) || { amount: 0, count: 0 };
    existing.amount += converted;
    existing.count += 1;
    categoryMap.set(cat, existing);
  }

  const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    amount: Math.round(data.amount * 100) / 100,
    count: data.count,
  }));

  // Payment history by month (last 12 months)
  const payments = await prisma.payment.findMany({
    where: {
      subscription: { userId },
      paidAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { paidAt: "asc" },
  });

  const monthMap = new Map<string, number>();
  for (const p of payments) {
    const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`;
    const converted = await toUserCurrency(p.amount, p.currency, userCurrency);
    monthMap.set(key, (monthMap.get(key) || 0) + converted);
  }

  const byMonth = Array.from(monthMap.entries()).map(([month, amount]) => ({
    month,
    amount: Math.round(amount * 100) / 100,
  }));

  // Upcoming renewals (next 30 days)
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  const upcoming = [];
  for (const s of subscriptions) {
    if (!s.nextRenewal || s.nextRenewal > thirtyDays) continue;
    const convertedAmount = await toUserCurrency(s.amount, s.currency, userCurrency);
    upcoming.push({
      id: s.id,
      serviceName: s.serviceName,
      amount: convertedAmount,
      originalAmount: s.amount,
      originalCurrency: s.currency,
      nextRenewal: s.nextRenewal.toISOString(),
      daysUntil: Math.ceil((s.nextRenewal.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    });
  }
  upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

  return NextResponse.json({
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    totalYearly: Math.round(totalMonthly * 12 * 100) / 100,
    currency: userCurrency,
    subscriptionCount: subscriptions.length,
    byCategory,
    byMonth,
    upcomingRenewals: upcoming,
  });
}
