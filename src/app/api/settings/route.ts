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
  let settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.userSettings.create({ data: { userId } });
  }

  return NextResponse.json({
    // Setup
    setupMode: settings.setupMode,
    dbType: settings.dbType,
    // LLM
    llmProvider: settings.llmProvider,
    llmBaseUrl: settings.llmBaseUrl,
    llmModel: settings.llmModel,
    hasLlmKey: !!settings.llmApiKey,
    // Gmail
    gmailEnabled: settings.gmailEnabled,
    // Outlook
    outlookEnabled: settings.outlookEnabled,
    outlookClientId: settings.outlookClientId,
    outlookTenantId: settings.outlookTenantId,
    hasOutlookSecret: !!settings.outlookSecret,
    outlookConnected: !!settings.outlookToken,
    // Prefs
    currency: settings.currency,
    country: settings.country,
    remindDaysBefore: settings.remindDaysBefore,
    monthlyBudget: settings.monthlyBudget,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  const allowed = [
    "setupMode", "dbType", "dbUrl",
    "llmProvider", "llmBaseUrl", "llmApiKey", "llmModel",
    "gmailEnabled",
    "outlookEnabled", "outlookClientId", "outlookSecret", "outlookTenantId",
    "currency", "country", "remindDaysBefore", "monthlyBudget",
  ];

  const update: Record<string, unknown> = {};
  for (const f of allowed) {
    if (body[f] !== undefined) update[f] = body[f];
  }

  await prisma.userSettings.upsert({
    where: { userId },
    update,
    create: { userId, ...update },
  });

  return NextResponse.json({ success: true });
}
