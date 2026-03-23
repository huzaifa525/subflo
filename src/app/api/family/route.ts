import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Get family members + their subscription totals
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  // Get members I invited + members who invited me
  const owned = await prisma.familyMember.findMany({
    where: { ownerId: userId, status: "accepted" },
    include: { member: { select: { id: true, name: true, email: true } } },
  });
  const memberOf = await prisma.familyMember.findMany({
    where: { memberId: userId, status: "accepted" },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  // Collect all family user IDs
  const familyUsers = [
    { id: userId, name: session.user.name || "You", email: session.user.email || "" },
    ...owned.map((m) => m.member),
    ...memberOf.map((m) => m.owner),
  ];

  // Get subscription totals for each
  const familyData = await Promise.all(
    familyUsers.map(async (u) => {
      const subs = await prisma.subscription.findMany({
        where: { userId: u.id, status: "active" },
      });
      const monthly = subs.reduce((sum, s) => {
        switch (s.billingCycle) {
          case "yearly": return sum + s.amount / 12;
          case "quarterly": return sum + s.amount / 3;
          case "weekly": return sum + s.amount * 4.33;
          default: return sum + s.amount;
        }
      }, 0);
      return {
        id: u.id,
        name: u.name || u.email.split("@")[0],
        email: u.email,
        subscriptionCount: subs.length,
        monthlyTotal: Math.round(monthly),
        isYou: u.id === userId,
      };
    })
  );

  // Pending invites
  const pending = await prisma.familyMember.findMany({
    where: { OR: [{ ownerId: userId }, { memberId: userId }], status: "pending" },
    include: {
      owner: { select: { email: true } },
      member: { select: { email: true } },
    },
  });

  return NextResponse.json({
    members: familyData,
    totalMonthly: familyData.reduce((sum, m) => sum + m.monthlyTotal, 0),
    pending: pending.map((p) => ({
      id: p.id,
      email: p.ownerId === userId ? p.member.email : p.owner.email,
      direction: p.ownerId === userId ? "sent" : "received",
    })),
  });
}

// Invite a family member
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const member = await prisma.user.findUnique({ where: { email } });
  if (!member) return NextResponse.json({ error: "User not found. They need to sign up first." }, { status: 404 });
  if (member.id === userId) return NextResponse.json({ error: "Cannot invite yourself" }, { status: 400 });

  await prisma.familyMember.upsert({
    where: { ownerId_memberId: { ownerId: userId, memberId: member.id } },
    update: { status: "accepted" }, // auto-accept for now
    create: { ownerId: userId, memberId: member.id, status: "accepted" },
  });

  return NextResponse.json({ success: true });
}
