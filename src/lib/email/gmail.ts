import { google } from "googleapis";
import { prisma } from "../db";
import { parseSubscriptionEmail, isLikelySubscriptionEmail, stripHtml } from "./parser";

const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

export function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

export async function syncGmailSubscriptions(
  userId: string,
  accessToken: string
) {
  const gmail = getGmailClient(accessToken);
  const results: Array<{
    messageId: string;
    subject: string;
    from: string;
    parsedData: unknown;
  }> = [];

  // Search for subscription-related emails
  const query =
    "subject:(receipt OR invoice OR subscription OR renewal OR billing OR payment) newer_than:90d";

  const response = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 50,
  });

  const messages = response.data.messages || [];

  for (const msg of messages) {
    // Skip if already processed
    const existing = await prisma.emailRecord.findUnique({
      where: {
        userId_messageId_provider: {
          userId,
          messageId: msg.id!,
          provider: "gmail",
        },
      },
    });
    if (existing) continue;

    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "full",
    });

    const headers = detail.data.payload?.headers || [];
    const subject =
      headers.find((h) => h.name?.toLowerCase() === "subject")?.value || "";
    const from =
      headers.find((h) => h.name?.toLowerCase() === "from")?.value || "";

    if (!isLikelySubscriptionEmail(subject, from)) continue;

    // Extract body
    let body = "";
    const payload = detail.data.payload;
    if (payload?.body?.data) {
      body = Buffer.from(payload.body.data, "base64").toString("utf-8");
    } else if (payload?.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          body = Buffer.from(part.body.data, "base64").toString("utf-8");
          break;
        }
        if (part.mimeType === "text/html" && part.body?.data) {
          body = stripHtml(
            Buffer.from(part.body.data, "base64").toString("utf-8")
          );
        }
      }
    }

    try {
      const parsed = await parseSubscriptionEmail(subject, body);

      await prisma.emailRecord.create({
        data: {
          userId,
          messageId: msg.id!,
          provider: "gmail",
          subject,
          from,
          parsedData: JSON.stringify(parsed),
          processed: parsed.is_subscription,
          receivedAt: detail.data.internalDate
            ? new Date(parseInt(detail.data.internalDate))
            : undefined,
        },
      });

      if (parsed.is_subscription) {
        results.push({ messageId: msg.id!, subject, from, parsedData: parsed });
      }
    } catch (error) {
      console.error(`Error parsing email ${msg.id}:`, error);
    }
  }

  return results;
}
