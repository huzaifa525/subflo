import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { processReminders } from "@/lib/email/send-reminder";

// Get pending notifications (renewals within reminder window)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const daysBefore = settings?.remindDaysBefore || 3;

  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() + daysBefore);

  const subs = await prisma.subscription.findMany({
    where: {
      userId,
      status: "active",
      nextRenewal: { lte: windowEnd, gte: new Date() },
    },
    orderBy: { nextRenewal: "asc" },
  });

  // Auto-process pending email reminders
  try { await processReminders(); } catch { /* silent */ }

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
