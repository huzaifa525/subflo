import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const subs = await prisma.subscription.findMany({ where: { userId, status: "active" } });

  const now = new Date();
  const insights: { type: string; icon: string; message: string; severity: "info" | "warning" | "success" }[] = [];

  // Monthly total
  let monthlyTotal = 0;
  for (const s of subs) {
    switch (s.billingCycle) {
      case "yearly": monthlyTotal += s.amount / 12; break;
      case "quarterly": monthlyTotal += s.amount / 3; break;
      case "weekly": monthlyTotal += s.amount * 4.33; break;
      default: monthlyTotal += s.amount;
    }
  }

  // Budget check
  const budget = settings?.monthlyBudget || 0;
  if (budget > 0 && monthlyTotal > budget) {
    insights.push({ type: "budget", icon: "⚠️", message: `Spending ${settings?.currency || "₹"}${Math.round(monthlyTotal)}/mo — over your ${settings?.currency || "₹"}${budget} budget!`, severity: "warning" });
  } else if (budget > 0 && monthlyTotal > budget * 0.8) {
    insights.push({ type: "budget", icon: "📊", message: `${Math.round((monthlyTotal / budget) * 100)}% of your ${settings?.currency || "₹"}${budget} budget used`, severity: "info" });
  }

  // Renewals this week
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const renewingThisWeek = subs.filter((s) => s.nextRenewal && s.nextRenewal >= now && s.nextRenewal <= weekFromNow);
  if (renewingThisWeek.length > 0) {
    insights.push({
      type: "renewal",
      icon: "📅",
      message: `${renewingThisWeek.length} subscription${renewingThisWeek.length > 1 ? "s" : ""} renewing this week: ${renewingThisWeek.map((s) => s.serviceName).join(", ")}`,
      severity: "warning",
    });
  }

  // Renewals today
  const today = now.toISOString().split("T")[0];
  const renewingToday = subs.filter((s) => s.nextRenewal?.toISOString().startsWith(today));
  if (renewingToday.length > 0) {
    insights.push({
      type: "today",
      icon: "🔔",
      message: `${renewingToday.map((s) => s.serviceName).join(", ")} renewing today!`,
      severity: "warning",
    });
  }

  // Most expensive
  if (subs.length >= 3) {
    const sorted = [...subs].sort((a, b) => b.amount - a.amount);
    insights.push({
      type: "expensive",
      icon: "💰",
      message: `Your most expensive: ${sorted[0].serviceName} (${sorted[0].currency} ${sorted[0].amount}/${sorted[0].billingCycle})`,
      severity: "info",
    });
  }

  // Category concentration
  const catMap = new Map<string, number>();
  for (const s of subs) catMap.set(s.category || "other", (catMap.get(s.category || "other") || 0) + 1);
  const topCat = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topCat && topCat[1] >= 3) {
    insights.push({
      type: "category",
      icon: "📊",
      message: `${topCat[1]} subscriptions in ${topCat[0]} — consider consolidating`,
      severity: "info",
    });
  }

  // Unused potential (no renewal set)
  const noRenewal = subs.filter((s) => !s.nextRenewal);
  if (noRenewal.length > 0) {
    insights.push({
      type: "missing",
      icon: "⚡",
      message: `${noRenewal.length} subscription${noRenewal.length > 1 ? "s" : ""} without renewal dates — set them to get reminders`,
      severity: "info",
    });
  }

  // Yearly savings tip
  const yearlyEligible = subs.filter((s) => s.billingCycle === "monthly" && s.amount > 100);
  if (yearlyEligible.length >= 2) {
    const potential = yearlyEligible.reduce((sum, s) => sum + s.amount * 2, 0); // ~17% savings
    insights.push({
      type: "savings",
      icon: "💡",
      message: `Switch ${yearlyEligible.length} monthly plans to yearly — could save ~₹${Math.round(potential)}/year`,
      severity: "success",
    });
  }

  return NextResponse.json({ insights, monthlyTotal: Math.round(monthlyTotal), subscriptionCount: subs.length });
}
