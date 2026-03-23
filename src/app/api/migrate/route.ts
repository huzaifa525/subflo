import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { mapServiceName } from "@/lib/service-mapper";

// Fix existing subscriptions — apply service mapper to clean up names, websites, categories
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const subs = await prisma.subscription.findMany({ where: { userId } });
  let updated = 0;

  for (const sub of subs) {
    console.log(`[Migrate] Checking: "${sub.serviceName}" | website: ${sub.website} | category: ${sub.category}`);
    const mapped = mapServiceName(sub.serviceName);
    console.log(`[Migrate] Mapped to: ${mapped ? mapped.name : "NO MATCH"}`);
    if (!mapped) continue;

    const changes: Record<string, string> = {};
    if (mapped.name !== sub.serviceName) changes.serviceName = mapped.name;
    // Fix website if missing, broken (short URLs like c.gle), or wrong
    if (mapped.website && (!sub.website || sub.website.length < 15 || sub.website.includes("c.gle") || sub.website.includes("goo.gl") || sub.website.includes("bit.ly"))) {
      changes.website = mapped.website;
    }
    if (mapped.category && (!sub.category || sub.category === "other")) changes.category = mapped.category;

    if (Object.keys(changes).length > 0) {
      await prisma.subscription.update({ where: { id: sub.id }, data: changes });
      console.log(`[Migrate] ${sub.serviceName} → ${changes.serviceName || sub.serviceName} (${Object.keys(changes).join(", ")})`);
      updated++;
    }
  }

  return NextResponse.json({ updated, total: subs.length });
}
