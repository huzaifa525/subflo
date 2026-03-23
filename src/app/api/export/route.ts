import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";

  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    include: { payments: true },
  });

  if (format === "csv") {
    const headers = [
      "Service",
      "Amount",
      "Currency",
      "Billing Cycle",
      "Next Renewal",
      "Category",
      "Status",
      "Source",
    ];
    const rows = subscriptions.map((s) =>
      [
        s.serviceName,
        s.amount,
        s.currency,
        s.billingCycle,
        s.nextRenewal?.toISOString().split("T")[0] || "",
        s.category || "",
        s.status,
        s.source,
      ].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="subflo-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return NextResponse.json(subscriptions);
}
