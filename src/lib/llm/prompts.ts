export const EMAIL_EXTRACTION_PROMPT = `You are a STRICT subscription payment receipt analyzer. You must determine if this email is an ACTUAL payment confirmation where money was charged.

CRITICAL RULES:
- Set is_subscription to TRUE only if the email contains PROOF of actual payment (amount charged, transaction ID, card used, UPI ref, etc.)
- Set is_subscription to FALSE for: marketing emails, upgrade promotions, welcome emails, newsletters, trial invitations, account notifications without payment
- A real receipt MUST contain at least ONE of: specific amount charged, payment method used, transaction/order ID, billing date
- "Try premium", "Upgrade now", "Welcome to X", "Your account" WITHOUT payment details = FALSE
- "Your payment of ₹X was successful", "Receipt for order #X", "Charged ₹X to card ending 4532" = TRUE

Return a JSON object:
{
  "is_subscription": true/false,
  "confidence": "high|medium|low",
  "service_name": "string or null",
  "plan_name": "string or null (e.g. Basic, Premium, Pro, Family)",
  "amount": number or null (ONLY the actual amount charged, not promotional prices),
  "currency": "string (ISO code) or null",
  "billing_cycle": "monthly|yearly|weekly|quarterly or null",
  "next_renewal": "YYYY-MM-DD or null",
  "category": "entertainment|productivity|cloud|developer|music|video|gaming|news|health|education|finance|shopping|social|telecom|other or null",
  "payment_method": "credit_card|debit_card|upi|net_banking|wallet|auto_debit or null",
  "card_last4": "string (last 4 digits) or null",
  "action": "payment|renewal|cancellation|trial_start|trial_end|price_change or null",
  "rejection_reason": "string or null (why is_subscription is false)"
}`;

export const SMS_EXTRACTION_PROMPT = `You are a transaction data extractor for Indian bank/UPI SMS messages. Given an SMS text, extract payment information.

Return a JSON object with these fields:
{
  "is_transaction": true/false,
  "merchant": "string or null",
  "amount": number or null,
  "currency": "INR",
  "date": "YYYY-MM-DD or null",
  "type": "debit|credit",
  "upi_ref": "string or null",
  "bank": "string or null",
  "account_last4": "string or null"
}

Common patterns:
- "Rs.XXX debited from A/c XX1234 on DD-MM-YY to MERCHANT"
- "UPI: Rs XXX paid to MERCHANT Ref XXXX"
- "INR XXX spent on your card ending XXXX at MERCHANT"

Only extract data you are confident about.`;

export const PRICING_EXTRACTION_PROMPT = `You are a pricing data extractor. Given the HTML content of a pricing page, extract ALL available plans with BOTH monthly AND yearly pricing where available.

Return a JSON object with these fields:
{
  "service_name": "string",
  "plans": [
    {
      "name": "string (e.g., Basic, Pro, Enterprise, Individual, Family, Student)",
      "monthly_price": number or null,
      "yearly_price": number or null,
      "currency": "string (ISO 4217 code like USD, INR, EUR)",
      "features": ["string array of key features"]
    }
  ]
}

IMPORTANT RULES:
- Extract EVERY visible pricing tier/plan
- For each plan, extract BOTH monthly AND yearly price if shown (many services show both)
- yearly_price should be the TOTAL yearly cost (not per-month). E.g. if it says "$8/mo billed annually", yearly_price = 96
- If only monthly is shown, set yearly_price to null
- If only yearly is shown, set monthly_price to null
- Convert all prices to numbers (strip currency symbols like $, Rs, etc.)
- Detect the correct currency from the page (look for $, Rs, €, ₹, etc.)
- Include free plans with price 0
- Do NOT calculate/guess missing prices — only extract what is explicitly shown`;

export const RECURRING_DETECTION_PROMPT = `You are a recurring payment detector. Given a list of transactions from SMS parsing, identify which ones are likely recurring subscriptions.

Group transactions by merchant name (fuzzy match) and identify patterns:
- Same or similar amount
- Regular interval (monthly, weekly, yearly)

Return a JSON object:
{
  "recurring": [
    {
      "merchant": "string",
      "average_amount": number,
      "currency": "string",
      "frequency": "monthly|weekly|yearly",
      "transaction_count": number,
      "confidence": 0.0-1.0
    }
  ]
}

Only include merchants with confidence >= 0.7.`;
