import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAlternatives } from "@/lib/pricing/aristocles";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const service = searchParams.get("service");

  if (!service) {
    return NextResponse.json({ error: "Provide service name" }, { status: 400 });
  }

  const alternatives = await getAlternatives(userId, service);
  return NextResponse.json({ alternatives });
}
