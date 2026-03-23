import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchModels } from "@/lib/llm/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { baseUrl, apiKey } = await req.json();

  if (!baseUrl) {
    return NextResponse.json({ error: "baseUrl is required" }, { status: 400 });
  }

  const models = await fetchModels(baseUrl, apiKey || "");

  return NextResponse.json({ models });
}
