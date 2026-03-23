import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { prisma } from "../db";

interface GmailCredentials {
  id: string;
  email: string;
  appPassword: string;
  label: string | null;
}

async function getAllAccounts(userId: string): Promise<GmailCredentials[]> {
  const accounts = await prisma.gmailAccount.findMany({ where: { userId } });
  return accounts.map((a) => ({ id: a.id, email: a.email, appPassword: a.appPassword, label: a.label }));
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

export async function testGmailConnection(email: string, appPassword: string): Promise<{ success: boolean; error?: string }> {
  const client = createClient({ id: "", email, appPassword, label: null });
  try {
    await client.connect();
    await client.logout();
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    if (msg.includes("AUTHENTICATIONFAILED")) return { success: false, error: "Invalid app password" };
    return { success: false, error: msg };
  }
}

export async function addGmailAccount(userId: string, email: string, appPassword: string, label?: string): Promise<{ success: boolean; error?: string }> {
  const test = await testGmailConnection(email, appPassword);
  if (!test.success) return test;

  await prisma.gmailAccount.upsert({
    where: { userId_email: { userId, email } },
    update: { appPassword: appPassword.replace(/\s/g, ""), label },
    create: { userId, email, appPassword: appPassword.replace(/\s/g, ""), label },
  });

  // Enable Gmail in settings
  await prisma.userSettings.upsert({
    where: { userId },
    update: { gmailEnabled: true },
    create: { userId, gmailEnabled: true },
  });

  return { success: true };
}

export async function removeGmailAccount(userId: string, email: string): Promise<void> {
  await prisma.gmailAccount.deleteMany({ where: { userId, email } });
  const remaining = await prisma.gmailAccount.count({ where: { userId } });
  if (remaining === 0) {
    await prisma.userSettings.update({ where: { userId }, data: { gmailEnabled: false } });
  }
}

export async function listGmailAccounts(userId: string): Promise<{ email: string; label: string | null; lastScanAt: string | null }[]> {
  const accounts = await prisma.gmailAccount.findMany({ where: { userId } });
  return accounts.map((a) => ({ email: a.email, label: a.label, lastScanAt: a.lastScanAt?.toISOString() || null }));
}

// Extract all URLs from email HTML/text
function extractUrls(html: string, text: string): string[] {
  const urls = new Set<string>();
  const urlRegex = /https?:\/\/[^\s"'<>]+/gi;

  for (const match of (html + " " + text).matchAll(urlRegex)) {
    let url = match[0].replace(/[)}\]>.,;]+$/, ""); // trim trailing punctuation
    try {
      const u = new URL(url);
      // Skip tracking/email pixels/unsubscribe
      if (u.pathname.includes("unsubscribe") || u.pathname.includes("track") ||
          u.pathname.includes("click") || u.pathname.includes("open") ||
          u.hostname.includes("mailchimp") || u.hostname.includes("sendgrid") ||
          u.hostname.includes("mandrillapp") || u.hostname.includes("list-manage")) continue;
      // Get clean domain URL
      urls.add(`https://${u.hostname}`);
    } catch { continue; }
  }
  return Array.from(urls);
}

// Detect service website from email
function detectWebsite(from: string, urls: string[]): string | null {
  // Try from address domain first
  const fromDomain = from.match(/@([a-z0-9.-]+)/i)?.[1];
  if (fromDomain && !["gmail.com", "google.com", "outlook.com", "yahoo.com", "hotmail.com",
    "mail.com", "protonmail.com", "icloud.com", "email.com"].includes(fromDomain)) {
    // Strip common email subdomains
    const clean = fromDomain.replace(/^(mail|email|noreply|billing|notify|notifications|support)\./i, "");
    return `https://${clean}`;
  }
  // Fallback: most common URL in email body (exclude google/apple/tracking)
  const dominated = urls.filter(u =>
    !u.includes("google.com") && !u.includes("apple.com") && !u.includes("gstatic")
    && !u.includes("googleapis") && !u.includes("doubleclick")
  );
  return dominated[0] || null;
}

export interface ScannedEmail {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  html: string;
  website: string | null;
  urls: string[];
}

export async function scanGmailSubscriptions(userId: string): Promise<{
  emails: ScannedEmail[];
  error?: string;
}> {
  const accounts = await getAllAccounts(userId);
  if (accounts.length === 0) return { emails: [], error: "No Gmail accounts configured" };

  const allEmails: ScannedEmail[] = [];
  for (const creds of accounts) {
    const result = await scanSingleAccount(creds);
    allEmails.push(...result.emails);
    // Update last scan time
    await prisma.gmailAccount.update({ where: { id: creds.id }, data: { lastScanAt: new Date() } });
  }

  // Deduplicate across accounts
  const unique: ScannedEmail[] = [];
  const seenSubjects = new Set<string>();
  allEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const e of allEmails) {
    const key = e.subject.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
    if (seenSubjects.has(key)) continue;
    seenSubjects.add(key);
    unique.push(e);
  }

  return { emails: unique };
}

async function scanSingleAccount(creds: GmailCredentials): Promise<{ emails: ScannedEmail[] }> {
  const client = createClient(creds);
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    const emails: ScannedEmail[] = [];
    const seenIds = new Set<string>();

    try {
      const since = new Date();
      since.setDate(since.getDate() - 90); // Last 3 months

      // Gmail-native search via X-GM-RAW — finds actual billing/receipt emails
      // This uses Gmail's own classification, not keyword matching
      const gmailQueries = [
        // Gmail's purchase/receipt detection
        'category:purchases',
        'category:updates subject:(receipt OR invoice OR payment OR subscription)',
        // Billing-specific senders
        'from:(noreply OR no-reply OR billing OR receipt OR invoice OR payment OR notify OR notification) subject:(receipt OR invoice OR payment OR subscription OR renewal OR order OR purchase OR charged)',
        // Transaction emails
        'subject:("payment received" OR "payment confirmation" OR "order confirmation" OR "your receipt" OR "your invoice" OR "billing statement" OR "subscription confirmation" OR "auto-renewal" OR "successfully charged" OR "thank you for your payment" OR "your plan")',
      ];

      for (const rawQuery of gmailQueries) {
        if (emails.length >= 200) break;
        try {
          // Use Gmail's X-GM-RAW IMAP extension for native Gmail search
          const results = await client.search({
            since,
            // @ts-expect-error -- X-GM-RAW is a Gmail IMAP extension not in types
            'x-gm-raw': rawQuery,
          });

          if (!results || !Array.isArray(results) || results.length === 0) continue;

          for (const uid of results.slice(0, 50)) {
            if (seenIds.has(String(uid)) || emails.length >= 200) continue;
            seenIds.add(String(uid));

            try {
              const msg = await client.fetchOne(uid, { source: true });
              if (!msg || !msg.source) continue;

              const parsed = await simpleParser(msg.source as Buffer);
              const subject = parsed.subject || "";
              const from = parsed.from?.text || "";
              const date = parsed.date?.toISOString() || "";
              const html = typeof parsed.html === "string" ? parsed.html : "";
              let text = parsed.text || "";
              if (!text && html) {
                text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                  .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
              }

              const urls = extractUrls(html, text);
              const website = detectWebsite(from, urls);

              emails.push({
                id: String(uid),
                subject,
                from,
                date,
                body: text.slice(0, 3000),
                html: html.slice(0, 5000),
                website,
                urls,
              });
            } catch { continue; }
          }
        } catch {
          // X-GM-RAW not supported — fallback to standard IMAP search
          try {
            const fallbackResults = await client.search({
              since,
              or: [
                { subject: "receipt" },
                { subject: "invoice" },
                { subject: "payment" },
                { subject: "subscription" },
                { subject: "renewal" },
                { subject: "billing" },
                { subject: "order confirmation" },
                { subject: "charged" },
              ],
            });
            if (!fallbackResults || !Array.isArray(fallbackResults)) continue;

            for (const uid of fallbackResults.slice(0, 30)) {
              if (seenIds.has(String(uid)) || emails.length >= 200) continue;
              seenIds.add(String(uid));

              try {
                const msg = await client.fetchOne(uid, { source: true });
                if (!msg || !msg.source) continue;
                const parsed = await simpleParser(msg.source as Buffer);
                const html = typeof parsed.html === "string" ? parsed.html : "";
                let text = parsed.text || "";
                if (!text && html) text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
                const urls = extractUrls(html, text);
                const website = detectWebsite(parsed.from?.text || "", urls);

                emails.push({
                  id: String(uid),
                  subject: parsed.subject || "",
                  from: parsed.from?.text || "",
                  date: parsed.date?.toISOString() || "",
                  body: text.slice(0, 3000),
                  html: html.slice(0, 5000),
                  website,
                  urls,
                });
              } catch { continue; }
            }
          } catch { continue; }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
    return { emails };
  } catch {
    return { emails: [] };
  }
}
