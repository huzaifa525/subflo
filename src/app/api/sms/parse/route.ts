import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseSMSText } from "@/lib/sms/manual";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { messages } = await req.json();

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Provide an array of SMS messages" },
      { status: 400 }
    );
  }

  const results = [];

  for (const text of messages.slice(0, 50)) {
    try {
      const parsed = await parseSMSText(text);

      const record = await prisma.sMSRecord.create({
        data: {
          userId,
          rawText: text,
          parsedMerchant: parsed.merchant,
          parsedAmount: parsed.amount,
          parsedDate: parsed.date ? new Date(parsed.date) : null,
          parsedCurrency: parsed.currency,
          processed: parsed.is_transaction,
        },
      });

      results.push({ id: record.id, ...parsed });
    } catch (error) {
      console.error("SMS parse error:", error);
      results.push({ error: "Failed to parse", text: text.slice(0, 50) });
    }
  }

  return NextResponse.json({ parsed: results });
}
