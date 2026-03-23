import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { prisma } from "../db";

interface GmailCredentials {
  email: string;
  appPassword: string;
}

async function getCredentials(userId: string): Promise<GmailCredentials | null> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings?.gmailEmail || !settings?.gmailAppPassword) return null;
  return { email: settings.gmailEmail, appPassword: settings.gmailAppPassword };
}

function createClient(creds: GmailCredentials): ImapFlow {
  return new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: creds.email, pass: creds.appPassword.replace(/\s/g, "") },
    logger: false,
  });
}

export async function testGmailConnection(userId: string): Promise<{ success: boolean; error?: string; email?: string }> {
  const creds = await getCredentials(userId);
  if (!creds) return { success: false, error: "Gmail email or app password not configured" };

  const client = createClient(creds);
  try {
    await client.connect();
    await client.logout();
    return { success: true, email: creds.email };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Connection failed";
    if (msg.includes("AUTHENTICATIONFAILED") || msg.includes("Invalid credentials")) {
      return { success: false, error: "Invalid app password. Check and try again." };
    }
    return { success: false, error: msg };
  }
}

// Comprehensive search queries to find ALL subscription emails
const SEARCH_QUERIES = [
  // Payment confirmations
  "subscription",
  "receipt",
  "invoice",
  "payment confirmation",
  "payment received",
  "order confirmation",
  // Recurring/renewal
  "renewal",
  "auto-renewal",
  "billing statement",
  "monthly charge",
  "your plan",
  "membership",
  // App stores
  "Google Play",
  "Play Store",
  "Apple receipt",
  "App Store",
  "iTunes",
  // Popular services
  "Netflix",
  "Spotify",
  "YouTube Premium",
  "Amazon Prime",
  "Disney+",
  "Hotstar",
  "ChatGPT",
  "Claude",
  "Cursor",
  "GitHub",
  "Notion",
  "Canva",
  "Adobe",
  "LinkedIn Premium",
  "Jio",
  "Airtel",
  // Billing keywords
  "charged",
  "debited",
  "recurring payment",
  "upcoming charge",
  "trial ending",
  "trial expired",
  "plan upgrade",
  "thank you for your purchase",
];

export async function scanGmailSubscriptions(userId: string): Promise<{
  emails: { id: string; subject: string; from: string; date: string; body: string }[];
  error?: string;
}> {
  const creds = await getCredentials(userId);
  if (!creds) return { emails: [], error: "Gmail not configured" };

  const client = createClient(creds);
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    const emails: { id: string; subject: string; from: string; date: string; body: string }[] = [];
    const seenIds = new Set<string>();

    try {
      const since = new Date();
      since.setDate(since.getDate() - 60);

      for (const query of SEARCH_QUERIES) {
        if (emails.length >= 150) break;
        try {
          const results = await client.search({
            since,
            or: [{ subject: query }, { body: query }],
          });
          if (!results || !Array.isArray(results) || results.length === 0) continue;

          for (const uid of results.slice(0, 10)) {
            if (seenIds.has(String(uid)) || emails.length >= 150) continue;
            seenIds.add(String(uid));

            try {
              const msg = await client.fetchOne(uid, { source: true, envelope: true });
              if (!msg || !msg.source) continue;

              const parsed = await simpleParser(msg.source as Buffer);
              let body = parsed.text || "";
              if (!body && parsed.html) {
                body = parsed.html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
              }

              emails.push({
                id: String(uid),
                subject: parsed.subject || "",
                from: parsed.from?.text || "",
                date: parsed.date?.toISOString() || "",
                body: body.slice(0, 2500),
              });
            } catch { continue; }
          }
        } catch { continue; }
      }
    } finally {
      lock.release();
    }

    await client.logout();
    emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Deduplicate by subject similarity
    const unique: typeof emails = [];
    const seenSubjects = new Set<string>();
    for (const e of emails) {
      const key = e.subject.toLowerCase().replace(/[^a-z]/g, "").slice(0, 30);
      if (seenSubjects.has(key)) continue;
      seenSubjects.add(key);
      unique.push(e);
    }

    return { emails: unique };
  } catch (err) {
    return { emails: [], error: err instanceof Error ? err.message : "Failed to scan" };
  }
}
