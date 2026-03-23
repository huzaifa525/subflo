import { Client } from "@microsoft/microsoft-graph-client";
import { prisma } from "../db";
import { parseSubscriptionEmail, isLikelySubscriptionEmail, stripHtml } from "./parser";

export function getOutlookClient(accessToken: string) {
  return Client.init({
    authProvider: (done) => done(null, accessToken),
  });
}

export async function syncOutlookSubscriptions(
  userId: string,
  accessToken: string
) {
  const client = getOutlookClient(accessToken);
  const results: Array<{
    messageId: string;
    subject: string;
    from: string;
    parsedData: unknown;
  }> = [];

  // Search for subscription-related emails from last 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const response = await client
    .api("/me/messages")
    .filter(
      `receivedDateTime ge ${cutoff.toISOString()} and (contains(subject, 'receipt') or contains(subject, 'subscription') or contains(subject, 'invoice') or contains(subject, 'renewal') or contains(subject, 'payment'))`
    )
    .select("id,subject,from,body,receivedDateTime")
    .top(50)
    .get();

  const messages = response.value || [];

  for (const msg of messages) {
    const existing = await prisma.emailRecord.findUnique({
      where: {
        userId_messageId_provider: {
          userId,
          messageId: msg.id,
          provider: "outlook",
        },
      },
    });
    if (existing) continue;

    const subject = msg.subject || "";
    const from = msg.from?.emailAddress?.address || "";

    if (!isLikelySubscriptionEmail(subject, from)) continue;

    const body = msg.body?.contentType === "html"
      ? stripHtml(msg.body.content || "")
      : msg.body?.content || "";

    try {
      const parsed = await parseSubscriptionEmail(subject, body);

      await prisma.emailRecord.create({
        data: {
          userId,
          messageId: msg.id,
          provider: "outlook",
          subject,
          from,
          parsedData: JSON.stringify(parsed),
          processed: parsed.is_subscription,
          receivedAt: msg.receivedDateTime
            ? new Date(msg.receivedDateTime)
            : undefined,
        },
      });

      if (parsed.is_subscription) {
        results.push({ messageId: msg.id, subject, from, parsedData: parsed });
      }
    } catch (error) {
      console.error(`Error parsing Outlook email ${msg.id}:`, error);
    }
  }

  return results;
}
