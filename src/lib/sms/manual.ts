import { extractJSON } from "../llm/client";
import { SMS_EXTRACTION_PROMPT } from "../llm/prompts";
import type { SMSExtractionResult } from "@/types";

export async function parseSMSText(
  smsText: string
): Promise<SMSExtractionResult> {
  return extractJSON<SMSExtractionResult>(smsText, SMS_EXTRACTION_PROMPT);
}

export async function parseBulkSMS(
  messages: string[]
): Promise<SMSExtractionResult[]> {
  const results: SMSExtractionResult[] = [];
  for (const msg of messages) {
    try {
      const result = await parseSMSText(msg);
      if (result.is_transaction) {
        results.push(result);
      }
    } catch (error) {
      console.error("Error parsing SMS:", error);
    }
  }
  return results;
}
