import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { processReminders, sendRenewalReminder } from "@/lib/email/send-reminder";
import { prisma } from "@/lib/db";

// Process all pending reminders
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await processReminders();
  return NextResponse.json(result);
}

// Send a test reminder for a specific subscription
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { subscriptionId } = await req.json();

  const sub = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId },
  });

  if (!sub || !sub.nextRenewal) {
    return NextResponse.json({ error: "Subscription not found or no renewal date" }, { status: 404 });
  }

  const sent = await sendRenewalReminder(userId, {
    serviceName: sub.serviceName,
    amount: sub.amount,
    currency: sub.currency,
    billingCycle: sub.billingCycle,
    nextRenewal: sub.nextRenewal,
  });

  return NextResponse.json({ sent, message: sent ? "Reminder email sent!" : "Failed — check Gmail account settings" });
}
