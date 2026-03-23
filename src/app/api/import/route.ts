import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { extractJSON } from "@/lib/llm/client";

const IMPORT_PROMPT = `You are a bank statement parser. Given CSV rows from a bank statement, identify recurring subscription payments.

Return a JSON object:
{
  "subscriptions": [
    {
      "service_name": "string",
      "amount": number,
      "currency": "string",
      "billing_cycle": "monthly|yearly|quarterly",
      "payment_method": "credit_card|debit_card|upi|net_banking|auto_debit",
      "card_last4": "string or null",
      "category": "string or null",
      "occurrences": number
    }
  ]
}

Rules:
- Only include RECURRING transactions (same merchant, similar amount, appearing 2+ times)
- Ignore one-time purchases, ATM withdrawals, transfers between accounts
- Group similar merchant names (e.g. "NETFLIX.COM" and "Netflix" are the same)
- Detect billing cycle from frequency of charges`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { csvContent } = await req.json();
  if (!csvContent || csvContent.length < 20) {
    return NextResponse.json({ error: "Provide CSV content" }, { status: 400 });
  }

  try {
    const result = await extractJSON<{ subscriptions: unknown[] }>(
      `Bank statement CSV:\n${csvContent.slice(0, 8000)}`,
      IMPORT_PROMPT,
      userId
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to parse statement",
      subscriptions: [],
    });
  }
}
