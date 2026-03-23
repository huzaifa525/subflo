/**
 * Pre-LLM payment detection filter
 * Scores emails 0-100 for likelihood of being a REAL payment receipt
 * Only emails scoring >= 40 get sent to LLM for extraction
 */

// TIER 1: Payment processors (ONLY send transactional emails)
const PAYMENT_PROCESSORS = [
  "googleplay-noreply@google.com",
  "payments-noreply@google.com",
  "no_reply@email.apple.com",
  "service@paypal.com",
  "member@paypal.com",
  "noreply@razorpay.com",
  "noreply@phonepe.com",
  "noreply@paytm.com",
  "msbill@microsoft.com",
];

const PAYMENT_PROCESSOR_REGEX = [
  /receipts\+acct_[a-z0-9]+@stripe\.com/i,
  /noreply@.*razorpay\.com/i,
  /auto-confirm@amazon\.(in|com)/i,
  /digital-no-reply@amazon\.(in|com)/i,
];

// TIER 2: Known billing senders
const BILLING_SENDERS = [
  "info@account.netflix.com",
  "info@members.netflix.com",
  "no-reply@spotify.com",
  "microsoft-noreply@microsoft.com",
  "mail@mail.adobe.com",
  "no-reply@dropbox.com",
  "noreply@zoom.us",
  "noreply@github.com",
];

const BILLING_SENDER_REGEX = /^(noreply|no-reply|billing|receipt|receipts|invoice|payments?|orders?|account|auto-confirm|digital-no-reply|msbill)@/i;

// Marketing senders to REJECT
const MARKETING_SENDERS = [
  /newsletter@/i, /marketing@/i, /promo@/i, /offers@/i, /deals@/i,
  /campaign@/i, /engage@/i, /hello@/i, /team@/i, /community@/i,
  /news@/i, /welcome@/i, /digest@/i, /weekly@/i,
  /@mailchimp\.com/i, /@sendgrid\.net/i, /@constantcontact\.com/i,
  /@hubspot\.com/i, /@klaviyo\.com/i, /@campaignmonitor\.com/i,
];

// Subject patterns: CONFIRMED payment
const PAYMENT_SUBJECTS = [
  /your (payment|receipt|invoice|order)/i,
  /payment (of|for|received|successful|confirmed|processed|completed)/i,
  /receipt (for|from|of)/i,
  /invoice (for|from|#?\d)/i,
  /(successfully |auto[- ]?)?charged/i,
  /order (receipt|confirmation|#?\d)/i,
  /subscription (renewed|activated|confirmed)/i,
  /renewal (confirmation|receipt)/i,
  /billing (statement|receipt|confirmation)/i,
  /thank you for your (payment|purchase|order)/i,
  /auto[- ]?renewal/i,
  /Google Play Order Receipt/i,
  /₹[\d,.]+|Rs\.?\s*[\d,.]+|\$[\d,.]+/,
];

// Subject patterns: PROMOTIONAL (not a real charge)
const PROMO_SUBJECTS = [
  /try (our|the|it)|get started/i,
  /upgrade (to|your|now)|switch to/i,
  /exclusive (offer|deal|discount)/i,
  /\d+%\s*off/i,
  /free trial|start.*free/i,
  /limited time|hurry|act now|don't miss/i,
  /welcome to|thanks for (signing|joining|registering)/i,
  /introducing|announcing|what's new/i,
  /tips|guide|how to|learn/i,
  /invite|referral|share with/i,
  /newsletter|weekly|digest/i,
  /explore|discover|check out/i,
  /we miss you|come back|reactivate/i,
  /save (up to|on|big)/i,
];

// Body: proof of actual charge
const PAYMENT_BODY = [
  /(?:₹|Rs\.?|INR|USD|\$|EUR|€|GBP|£)\s*[\d,]+\.?\d*/i,
  /card\s*(ending|ending in|xxxx|\*{4})\s*\d{4}/i,
  /\*{4}\s*\d{4}/,
  /ending\s*(in\s*)?\d{4}/i,
  /UPI\s*(ref|reference|id|transaction)[:\s]*\d+/i,
  /transaction\s*(id|number|ref)[:\s]*[A-Z0-9-]+/i,
  /order\s*(id|number|#)[:\s]*[A-Z0-9-]+/i,
  /GPA\.\d{4}-\d{4}-\d{4}-\d{5}/i,
  /receipt\s*#?\s*[A-Z0-9-]+/i,
  /payment\s*(was\s*)?(successful|received|processed|completed|confirmed)/i,
  /has been (charged|debited|deducted|processed)/i,
  /amount\s*(charged|paid|debited|deducted)/i,
  /billed (to|on|at)/i,
  /next (billing|renewal|payment) (date|on)/i,
];

// Body: NOT a real charge (marketing)
const NOT_PAYMENT_BODY = [
  /subscribe now|sign up|start.*trial/i,
  /click here to (buy|purchase|subscribe|upgrade)/i,
  /add to cart|buy now|shop now/i,
  /unsubscribe from this (email|newsletter|mailing)/i,
  /you('re| are) receiving this.*because.*(signed up|subscribed|registered)/i,
  /manage.*email.*preferences/i,
  /view.*in.*browser/i,
  /forward.*to.*friend/i,
];

export interface PaymentScore {
  score: number;
  isPayment: boolean;
  signals: string[];
}

export function scorePaymentLikelihood(subject: string, from: string, body: string): PaymentScore {
  let score = 0;
  const signals: string[] = [];

  // Sender checks
  const fromLower = from.toLowerCase();

  if (PAYMENT_PROCESSORS.some((s) => fromLower.includes(s)) || PAYMENT_PROCESSOR_REGEX.some((r) => r.test(fromLower))) {
    score += 35;
    signals.push("payment-processor-sender");
  } else if (BILLING_SENDERS.some((s) => fromLower.includes(s))) {
    score += 25;
    signals.push("known-billing-sender");
  } else if (BILLING_SENDER_REGEX.test(fromLower)) {
    score += 10;
    signals.push("billing-sender-pattern");
  }

  if (MARKETING_SENDERS.some((r) => r.test(fromLower))) {
    score -= 30;
    signals.push("marketing-sender");
  }

  // Subject checks
  if (PAYMENT_SUBJECTS.some((r) => r.test(subject))) {
    score += 20;
    signals.push("payment-subject");
  }

  if (PROMO_SUBJECTS.some((r) => r.test(subject))) {
    score -= 25;
    signals.push("promo-subject");
  }

  // Body checks
  let bodyHits = 0;
  for (const r of PAYMENT_BODY) {
    if (r.test(body)) bodyHits++;
  }
  if (bodyHits >= 3) {
    score += 25;
    signals.push(`strong-payment-body(${bodyHits})`);
  } else if (bodyHits >= 1) {
    score += 10;
    signals.push(`weak-payment-body(${bodyHits})`);
  }

  if (NOT_PAYMENT_BODY.some((r) => r.test(body))) {
    score -= 20;
    signals.push("marketing-body");
  }

  // "unsubscribe" without payment proof = newsletter
  if (/unsubscribe/i.test(body) && bodyHits === 0) {
    score -= 15;
    signals.push("unsubscribe-no-payment-proof");
  }

  score = Math.max(0, Math.min(100, score));

  return { score, isPayment: score >= 25, signals };
}
