import { extractJSON } from "../llm/client";
import { EMAIL_EXTRACTION_PROMPT } from "../llm/prompts";
import type { EmailExtractionResult } from "@/types";

export async function parseSubscriptionEmail(
  subject: string,
  body: string
): Promise<EmailExtractionResult> {
  const prompt = `Subject: ${subject}\n\nBody:\n${body.slice(0, 3000)}`;
  return extractJSON<EmailExtractionResult>(prompt, EMAIL_EXTRACTION_PROMPT);
}

const SUBSCRIPTION_KEYWORDS = [
  "receipt",
  "invoice",
  "subscription",
  "renewal",
  "billing",
  "payment",
  "charged",
  "auto-renewal",
  "trial",
  "plan",
  "membership",
  "recurring",
  "monthly",
  "annual",
  "yearly",
];

export function isLikelySubscriptionEmail(
  subject: string,
  from: string
): boolean {
  const text = `${subject} ${from}`.toLowerCase();
  return SUBSCRIPTION_KEYWORDS.some((kw) => text.includes(kw));
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
