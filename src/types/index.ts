export interface SubscriptionInput {
  serviceName: string;
  amount: number;
  currency?: string;
  billingCycle?: string;
  nextRenewal?: string;
  category?: string;
  status?: string;
  logoUrl?: string;
  website?: string;
  source?: string;
  notes?: string;
}

export interface EmailExtractionResult {
  is_subscription: boolean;
  service_name: string | null;
  amount: number | null;
  currency: string | null;
  billing_cycle: string | null;
  next_renewal: string | null;
  category: string | null;
  action: string | null;
}

export interface SMSExtractionResult {
  is_transaction: boolean;
  merchant: string | null;
  amount: number | null;
  currency: string;
  date: string | null;
  type: "debit" | "credit";
  upi_ref: string | null;
  bank: string | null;
  account_last4: string | null;
}

export interface PricingResult {
  service_name: string;
  plans: {
    name: string;
    price: number;
    currency: string;
    billing_cycle: string;
    features: string[];
  }[];
}

export interface RecurringDetection {
  merchant: string;
  average_amount: number;
  currency: string;
  frequency: string;
  transaction_count: number;
  confidence: number;
}

export interface ServicePlan {
  name: string;
  price: number;
  currency: string;
  cycle: string;
  yearlyPrice?: number;
}

export interface ServiceInfo {
  id: string;
  name: string;
  website: string;
  category: string;
  plans: ServicePlan[];
}

export interface AnalyticsData {
  totalMonthly: number;
  totalYearly: number;
  currency: string;
  byCategory: { category: string; amount: number; count: number }[];
  byMonth: { month: string; amount: number }[];
  upcomingRenewals: {
    id: string;
    serviceName: string;
    amount: number;
    nextRenewal: string;
    daysUntil: number;
  }[];
}
