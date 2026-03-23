import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPricing } from "@/lib/pricing/aristocles";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { serviceName } = await req.json();

  if (!serviceName) {
    return NextResponse.json({ error: "Provide serviceName", plans: [] }, { status: 400 });
  }

  try {
    const result = await getPricing(userId, serviceName);
    if (result && result.plans.length > 0) {
      return NextResponse.json(result);
    }
    // Return 200 with empty plans — not an error, just no data found
    return NextResponse.json({
      service_name: serviceName,
      plans: [],
      source: "aristocles",
      message: "Service not found in pricing database",
    });
  } catch (error) {
    return NextResponse.json({
      plans: [],
      error: error instanceof Error ? error.message : "Failed to fetch pricing",
    }, { status: 500 });
  }
}
