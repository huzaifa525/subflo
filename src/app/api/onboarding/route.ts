import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  await prisma.userSettings.upsert({
    where: { userId },
    update: {
      setupMode: body.setupMode || "individual",
      dbType: body.dbType || "sqlite",
      dbUrl: body.dbUrl || "",
      llmProvider: body.llmProvider || "ollama",
      llmBaseUrl: body.llmBaseUrl || "http://localhost:11434/v1",
      llmApiKey: body.llmApiKey || "",
      llmModel: body.llmModel || "llama3.1:8b",
      gmailEnabled: body.gmailEnabled || false,
      outlookEnabled: body.outlookEnabled || false,
      outlookClientId: body.outlookClientId || "",
      outlookSecret: body.outlookSecret || "",
      outlookTenantId: body.outlookTenantId || "common",
      currency: body.currency || "INR",
      remindDaysBefore: body.remindDaysBefore || 3,
    },
    create: {
      userId,
      setupMode: body.setupMode || "individual",
      dbType: body.dbType || "sqlite",
      dbUrl: body.dbUrl || "",
      llmProvider: body.llmProvider || "ollama",
      llmBaseUrl: body.llmBaseUrl || "http://localhost:11434/v1",
      llmApiKey: body.llmApiKey || "",
      llmModel: body.llmModel || "llama3.1:8b",
      gmailEnabled: body.gmailEnabled || false,
      outlookEnabled: body.outlookEnabled || false,
      outlookClientId: body.outlookClientId || "",
      outlookSecret: body.outlookSecret || "",
      outlookTenantId: body.outlookTenantId || "common",
      currency: body.currency || "INR",
      remindDaysBefore: body.remindDaysBefore || 3,
    },
  });

  await prisma.user.update({ where: { id: userId }, data: { onboarded: true } });

  return NextResponse.json({ success: true });
}
