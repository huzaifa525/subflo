import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPricing } from "@/lib/pricing/aristocles";

// Check if any subscription prices have changed
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const subs = await prisma.subscription.findMany({
    where: { userId, status: "active" },
  });

  const alerts: {
    serviceName: string;
    currentAmount: number;
    newAmount: number;
    currency: string;
    change: number; // percentage
    direction: "up" | "down";
  }[] = [];

  // Check up to 5 services (API rate limit)
  for (const sub of subs.slice(0, 5)) {
    try {
      const pricing = await getPricing(userId, sub.serviceName);
      if (!pricing || pricing.plans.length === 0) continue;

      // Find matching plan
      const match = pricing.plans.find(
        (p) => p.name.toLowerCase() === (sub.planName || "").toLowerCase()
      ) || pricing.plans.find(
        (p) => Math.abs((p.monthly_price || 0) - sub.amount) < sub.amount * 0.1
      );

      if (!match) continue;

      const livePrice = sub.billingCycle === "yearly"
        ? (match.yearly_price || (match.monthly_price || 0) * 12)
        : (match.monthly_price || 0);

      if (livePrice <= 0 || Math.abs(livePrice - sub.amount) < 1) continue;

      const change = ((livePrice - sub.amount) / sub.amount) * 100;
      alerts.push({
        serviceName: sub.serviceName,
        currentAmount: sub.amount,
        newAmount: livePrice,
        currency: sub.currency,
        change: Math.round(change),
        direction: livePrice > sub.amount ? "up" : "down",
      });
    } catch { continue; }
  }

  return NextResponse.json({ alerts });
}
