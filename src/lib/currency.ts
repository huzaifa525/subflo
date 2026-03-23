const CDN_URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1";
const FALLBACK_URL = "https://latest.currency-api.pages.dev/v1";

// In-memory cache (TTL: 1 hour)
let ratesCache: { base: string; rates: Record<string, number>; fetchedAt: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function fetchRates(base: string = "usd"): Promise<Record<string, number>> {
  const now = Date.now();
  if (ratesCache && ratesCache.base === base.toLowerCase() && now - ratesCache.fetchedAt < CACHE_TTL) {
    return ratesCache.rates;
  }

  const code = base.toLowerCase();

  // Try primary CDN first, fallback to Cloudflare
  for (const url of [
    `${CDN_URL}/currencies/${code}.min.json`,
    `${FALLBACK_URL}/currencies/${code}.min.json`,
  ]) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const data = await res.json();
      const rates = data[code] as Record<string, number>;
      if (rates) {
        ratesCache = { base: code, rates, fetchedAt: now };
        return rates;
      }
    } catch {
      continue;
    }
  }

  throw new Error(`Failed to fetch exchange rates for ${base}`);
}

export async function convert(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (from.toLowerCase() === to.toLowerCase()) return amount;

  const rates = await fetchRates(from.toLowerCase());
  const rate = rates[to.toLowerCase()];

  if (!rate) {
    throw new Error(`No exchange rate found for ${from} -> ${to}`);
  }

  return Math.round(amount * rate * 100) / 100;
}

export async function convertAll(
  items: { amount: number; currency: string }[],
  targetCurrency: string
): Promise<number> {
  let total = 0;

  // Group by currency to minimize API calls
  const byCurrency = new Map<string, number>();
  for (const item of items) {
    const cur = item.currency.toLowerCase();
    byCurrency.set(cur, (byCurrency.get(cur) || 0) + item.amount);
  }

  for (const [currency, amount] of byCurrency) {
    total += await convert(amount, currency, targetCurrency);
  }

  return Math.round(total * 100) / 100;
}

export async function getAllCurrencies(): Promise<Record<string, string>> {
  for (const url of [
    `${CDN_URL}/currencies.min.json`,
    `${FALLBACK_URL}/currencies.min.json`,
  ]) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      return await res.json();
    } catch {
      continue;
    }
  }
  // Fallback to common currencies
  return {
    inr: "Indian Rupee",
    usd: "US Dollar",
    eur: "Euro",
    gbp: "British Pound",
    aed: "UAE Dirham",
    jpy: "Japanese Yen",
    cad: "Canadian Dollar",
    aud: "Australian Dollar",
  };
}
