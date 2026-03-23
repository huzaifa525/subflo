import { extractJSON } from "../llm/client";
import { RECURRING_DETECTION_PROMPT } from "../llm/prompts";
import type { SMSExtractionResult, RecurringDetection } from "@/types";

export async function detectRecurringPayments(
  transactions: SMSExtractionResult[]
): Promise<RecurringDetection[]> {
  if (transactions.length < 2) return [];

  const prompt = `Here are the parsed transactions:\n${JSON.stringify(transactions, null, 2)}`;

  const result = await extractJSON<{ recurring: RecurringDetection[] }>(
    prompt,
    RECURRING_DETECTION_PROMPT
  );

  return result.recurring || [];
}

export function groupByMerchant(
  transactions: SMSExtractionResult[]
): Map<string, SMSExtractionResult[]> {
  const groups = new Map<string, SMSExtractionResult[]>();

  for (const tx of transactions) {
    if (!tx.merchant) continue;
    const key = tx.merchant.toLowerCase().trim();
    const existing = groups.get(key) || [];
    existing.push(tx);
    groups.set(key, existing);
  }

  return groups;
}
