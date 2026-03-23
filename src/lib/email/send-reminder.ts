import nodemailer from "nodemailer";
import { prisma } from "../db";
import { fmt } from "../currency-symbols";

async function getSmtpTransport(userId: string) {
  // Get first Gmail account for sending
  const account = await prisma.gmailAccount.findFirst({ where: { userId } });
  if (!account) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: account.email,
      pass: account.appPassword,
    },
  });
}

export async function sendRenewalReminder(
  userId: string,
  subscription: {
    serviceName: string;
    amount: number;
    currency: string;
    billingCycle: string;
    nextRenewal: Date;
  }
): Promise<boolean> {
  const transport = await getSmtpTransport(userId);
  if (!transport) return false;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) return false;

  const account = await prisma.gmailAccount.findFirst({ where: { userId } });
  if (!account) return false;

  const daysUntil = Math.ceil((subscription.nextRenewal.getTime() - Date.now()) / 86400000);
  const renewDate = subscription.nextRenewal.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  try {
    await transport.sendMail({
      from: `Subflo <${account.email}>`,
      to: user.email,
      subject: `${subscription.serviceName} renewing ${daysUntil <= 0 ? "today" : `in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`} — ${fmt(subscription.amount, subscription.currency)}`,
      html: `
        <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <div style="background: #f9f9fb; border: 1px solid #e4e4e9; border-radius: 12px; padding: 24px;">
            <h2 style="margin: 0 0 4px; font-size: 18px; color: #1a1a2e;">Subscription Renewal</h2>
            <p style="margin: 0 0 20px; font-size: 13px; color: #6b6b80;">from Subflo</p>

            <div style="background: white; border: 1px solid #e4e4e9; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #1a1a2e;">${subscription.serviceName}</p>
              <p style="margin: 0; font-size: 13px; color: #6b6b80;">${subscription.billingCycle} subscription</p>
            </div>

            <div style="display: flex; gap: 12px; margin-bottom: 16px;">
              <div style="flex: 1; background: white; border: 1px solid #e4e4e9; border-radius: 8px; padding: 12px;">
                <p style="margin: 0 0 2px; font-size: 11px; color: #9b9bae; text-transform: uppercase;">Amount</p>
                <p style="margin: 0; font-size: 20px; font-weight: 600; color: #1a1a2e;">${fmt(subscription.amount, subscription.currency)}</p>
              </div>
              <div style="flex: 1; background: white; border: 1px solid #e4e4e9; border-radius: 8px; padding: 12px;">
                <p style="margin: 0 0 2px; font-size: 11px; color: #9b9bae; text-transform: uppercase;">Renews on</p>
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${daysUntil <= 1 ? "#dc2626" : "#1a1a2e"};">${renewDate}</p>
                <p style="margin: 0; font-size: 11px; color: ${daysUntil <= 1 ? "#dc2626" : "#6b6b80"};">${daysUntil <= 0 ? "Today!" : `${daysUntil} day${daysUntil > 1 ? "s" : ""} left`}</p>
              </div>
            </div>

            <p style="margin: 0; font-size: 11px; color: #9b9bae; text-align: center;">
              Sent by Subflo — your subscription tracker
            </p>
          </div>
        </div>
      `,
      text: `${subscription.serviceName} is renewing ${daysUntil <= 0 ? "today" : `in ${daysUntil} days`} for ${fmt(subscription.amount, subscription.currency)}. Renewal date: ${renewDate}.`,
    });
    return true;
  } catch (err) {
    console.error("[Reminder] Failed to send:", err instanceof Error ? err.message : err);
    return false;
  }
}

// Check and send all pending reminders
export async function processReminders(): Promise<{ sent: number; failed: number }> {
  const now = new Date();
  const reminders = await prisma.reminder.findMany({
    where: {
      sent: false,
      remindAt: { lte: now },
    },
    include: {
      subscription: {
        include: { user: true },
      },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const reminder of reminders) {
    const sub = reminder.subscription;
    if (!sub.nextRenewal || sub.status !== "active") {
      // Mark as sent to skip in future
      await prisma.reminder.update({ where: { id: reminder.id }, data: { sent: true } });
      continue;
    }

    const success = await sendRenewalReminder(sub.userId, {
      serviceName: sub.serviceName,
      amount: sub.amount,
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      nextRenewal: sub.nextRenewal,
    });

    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { sent: true },
    });

    if (success) sent++;
    else failed++;
  }

  return { sent, failed };
}
