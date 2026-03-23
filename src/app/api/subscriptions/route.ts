import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    include: { reminders: true },
    orderBy: { nextRenewal: "asc" },
  });

  return NextResponse.json(subscriptions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  // Prevent duplicates — check if same service already exists
  const existing = await prisma.subscription.findFirst({
    where: {
      userId,
      serviceName: body.serviceName,
      status: "active",
    },
  });

  if (existing) {
    return NextResponse.json({
      error: `"${body.serviceName}" is already being tracked`,
      existing: { id: existing.id, serviceName: existing.serviceName },
    }, { status: 409 });
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      serviceName: body.serviceName,
      planName: body.planName || null,
      amount: typeof body.amount === "number" ? body.amount : parseFloat(body.amount) || 0,
      currency: body.currency || "INR",
      billingCycle: body.billingCycle || "monthly",
      nextRenewal: body.nextRenewal ? new Date(body.nextRenewal) : null,
      category: body.category || null,
      status: body.status || "active",
      paymentMethod: body.paymentMethod || null,
      cardLast4: body.cardLast4 || null,
      autoRenew: body.autoRenew ?? true,
      sharedWith: body.sharedWith || null,
      logoUrl: body.logoUrl || null,
      website: body.website || null,
      source: body.source || "manual",
      notes: body.notes || null,
      startedAt: body.startedAt ? new Date(body.startedAt) : null,
    },
  });

  // Create default reminder (3 days before renewal)
  if (subscription.nextRenewal) {
    const remindAt = new Date(subscription.nextRenewal);
    remindAt.setDate(remindAt.getDate() - 3);
    await prisma.reminder.create({
      data: {
        subscriptionId: subscription.id,
        remindAt,
        type: "before_renewal",
        daysBefore: 3,
      },
    });
  }

  return NextResponse.json(subscription, { status: 201 });
}
