import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const subscription = await prisma.subscription.findFirst({
    where: { id, userId },
    include: { payments: { orderBy: { paidAt: "desc" } }, reminders: true, receipts: { orderBy: { createdAt: "desc" } } },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(subscription);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  const existing = await prisma.subscription.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};
  const fields = [
    "serviceName", "planName", "amount", "currency", "billingCycle",
    "category", "status", "paymentMethod", "cardLast4", "autoRenew",
    "sharedWith", "logoUrl", "website", "source", "notes",
  ];
  for (const f of fields) {
    if (body[f] !== undefined) update[f] = body[f];
  }
  if (body.nextRenewal !== undefined) update.nextRenewal = body.nextRenewal ? new Date(body.nextRenewal) : null;
  if (body.startedAt !== undefined) update.startedAt = body.startedAt ? new Date(body.startedAt) : null;

  const subscription = await prisma.subscription.update({
    where: { id },
    data: update,
  });

  return NextResponse.json(subscription);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const existing = await prisma.subscription.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.subscription.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
