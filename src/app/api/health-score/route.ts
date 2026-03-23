import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Calculate subscription health score (0-100)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const subs = await prisma.subscription.findMany({ where: { userId } });
  const settings = await prisma.userSettings.findUnique({ where: { userId } });

  if (subs.length === 0) return NextResponse.json({ score: 100, grade: "A+", tips: ["Add your first subscription to start tracking"], breakdown: {} });

  const active = subs.filter((s) => s.status === "active");
  let score = 100;
  const tips: string[] = [];

  // Deduction: subscriptions without renewal dates (lose up to 15 points)
  const noRenewal = active.filter((s) => !s.nextRenewal);
  if (noRenewal.length > 0) {
    score -= Math.min(15, noRenewal.length * 5);
    tips.push(`${noRenewal.length} subscription${noRenewal.length > 1 ? "s" : ""} missing renewal date — add dates to get reminders`);
  }

  // Deduction: no category set (lose up to 10 points)
  const noCat = active.filter((s) => !s.category || s.category === "other");
  if (noCat.length > active.length * 0.5) {
    score -= 10;
    tips.push("Categorize your subscriptions for better analytics");
  }

  // Deduction: all monthly when yearly would save money (lose up to 10 points)
  const monthlyExpensive = active.filter((s) => s.billingCycle === "monthly" && s.amount > 200);
  if (monthlyExpensive.length >= 3) {
    score -= 10;
    tips.push(`${monthlyExpensive.length} expensive monthly plans — switching to yearly could save ~17%`);
  }

  // Deduction: over budget (lose up to 20 points)
  const budget = settings?.monthlyBudget || 0;
  if (budget > 0) {
    const monthlyTotal = active.reduce((sum, s) => {
      switch (s.billingCycle) {
        case "yearly": return sum + s.amount / 12;
        case "quarterly": return sum + s.amount / 3;
        default: return sum + s.amount;
      }
    }, 0);
    if (monthlyTotal > budget) {
      score -= 20;
      tips.push("You're over budget! Consider pausing or cancelling some subscriptions");
    } else if (monthlyTotal > budget * 0.9) {
      score -= 5;
      tips.push("Almost at budget limit — keep an eye on new subscriptions");
    }
  }

  // Deduction: too many subscriptions in same category (lose up to 10 points)
  const catCounts = new Map<string, number>();
  for (const s of active) catCounts.set(s.category || "other", (catCounts.get(s.category || "other") || 0) + 1);
  for (const [cat, count] of catCounts) {
    if (count >= 4) {
      score -= 10;
      tips.push(`${count} subscriptions in "${cat}" — do you need all of them?`);
      break;
    }
  }

  // Deduction: cancelled subs still showing (lose 5 points)
  const cancelled = subs.filter((s) => s.status === "cancelled");
  if (cancelled.length > 3) {
    score -= 5;
    tips.push("Clean up old cancelled subscriptions");
  }

  // Bonus: well-managed (add up to 10 points)
  if (noRenewal.length === 0 && noCat.length === 0) score = Math.min(100, score + 5);
  if (active.length > 0 && active.length <= 15) score = Math.min(100, score + 5);

  score = Math.max(0, Math.min(100, score));

  const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : score >= 50 ? "D" : "F";

  return NextResponse.json({
    score,
    grade,
    tips: tips.slice(0, 5),
    breakdown: {
      active: active.length,
      paused: subs.filter((s) => s.status === "paused").length,
      cancelled: cancelled.length,
      withRenewalDates: active.length - noRenewal.length,
      categorized: active.length - noCat.length,
    },
  });
}
