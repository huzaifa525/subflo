/**
 * Aristocles Subscription Pricing API
 * Fully automatic: auto-registers, stores key, detects country
 * Tested response shapes from live API.
 */

import { prisma } from "../db";

const BASE = "https://api.aristocles.com.au/v1";

export interface AristoclesPlan {
  name: string;
  monthly_price: number | null;
  yearly_price: number | null;
  currency: string;
  features: string[];
}

export interface AristoclesPricing {
  service_name: string;
  plans: AristoclesPlan[];
  source: "aristocles";
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Key management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function registerKey(email: string, name: string): Promise<string | null> {
  try {
    console.log("[Aristocles] Registering:", email);
    const res = await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: name || "Subflo User" }),
      signal: AbortSignal.timeout(10000),
    });

    const text = await res.text();
    console.log("[Aristocles] Register:", res.status, text.slice(0, 200));

    if (!res.ok) return null;

    try {
      const json = JSON.parse(text);
      return json?.data?.api_key || null;
    } catch {
      return null;
    }
  } catch (err) {
    console.error("[Aristocles] Register error:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function ensureApiKey(userId: string): Promise<string | null> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (settings?.aristoclesKey) return settings.aristoclesKey;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user?.email) return null;

  // Try with a unique email using timestamp to guarantee no conflict
  const [local, domain] = user.email.split("@");
  const uniqueEmail = `${local}+sf${Date.now()}@${domain}`;

  const key = await registerKey(uniqueEmail, user.name || "");

  if (key) {
    // Save IMMEDIATELY — don't do anything else first
    await prisma.userSettings.upsert({
      where: { userId },
      update: { aristoclesKey: key },
      create: { userId, aristoclesKey: key },
    });
    return key;
  }

  return null;
}

async function refreshKey(userId: string): Promise<string | null> {
  await prisma.userSettings.upsert({
    where: { userId },
    update: { aristoclesKey: "" },
    create: { userId, aristoclesKey: "" },
  });
  return ensureApiKey(userId);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Country detection
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function getCountry(userId: string): Promise<string> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (settings?.country) return settings.country;

  let country = "IN";
  try {
    const res = await fetch("https://ipapi.co/country_code/", { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const text = (await res.text()).trim().toUpperCase();
      if (text.length === 2) country = text;
    }
  } catch { /* default IN */ }

  // Save detected country
  try {
    if (settings) {
      await prisma.userSettings.update({ where: { userId }, data: { country } });
    } else {
      await prisma.userSettings.create({ data: { userId, country } });
    }
  } catch { /* ignore — country is nice-to-have */ }

  return country;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API call with auto-retry
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function api(userId: string, path: string): Promise<unknown> {
  let key = await ensureApiKey(userId);
  if (!key) {
    console.error("[Aristocles] Could not get API key for user", userId);
    throw new Error("Could not get pricing API key. Registration may have failed.");
  }

  console.log("[Aristocles] GET", `${BASE}${path}`);

  let res = await fetch(`${BASE}${path}`, {
    headers: { "X-API-Key": key },
    signal: AbortSignal.timeout(10000),
  });

  // Auth failed — re-register and retry
  if (res.status === 401 || res.status === 403) {
    console.log("[Aristocles] Key invalid, refreshing...");
    key = await refreshKey(userId);
    if (!key) throw new Error("Could not refresh pricing API key");
    res = await fetch(`${BASE}${path}`, {
      headers: { "X-API-Key": key },
      signal: AbortSignal.timeout(10000),
    });
  }

  const text = await res.text();

  if (!res.ok) {
    console.error("[Aristocles] API error", res.status, text.slice(0, 300));
    throw new Error(`Pricing API error: ${res.status}`);
  }

  try {
    const json = JSON.parse(text);
    console.log("[Aristocles] Response:", path.split("?")[0], JSON.stringify(json.data ?? json).slice(0, 300));
    return json.data ?? json;
  } catch {
    console.error("[Aristocles] Invalid JSON:", text.slice(0, 200));
    throw new Error("Invalid API response");
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Search services
// Response shape: { items: [...], total, page, per_page, pages }
// Each item: { id, name, slug, category_name, category_slug, website_url, cheapest_monthly_price }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function searchServices(
  userId: string,
  query: string
): Promise<{ slug: string; name: string; category: string }[]> {
  try {
    const data = await api(userId, `/services?search=${encodeURIComponent(query)}&per_page=10`) as Record<string, unknown>;
    console.log("[Aristocles] Services raw:", JSON.stringify(data).slice(0, 300));

    // Paginated: data.items is the array
    const items = (data.items || data) as Record<string, unknown>[];
    if (!Array.isArray(items)) { console.log("[Aristocles] items not array:", typeof items); return []; }

    return items.map((s) => ({
      slug: String(s.slug || ""),
      name: String(s.name || ""),
      category: String(s.category_name || s.category_slug || ""),
    }));
  } catch (err) {
    console.error("[Aristocles] searchServices error:", err instanceof Error ? err.message : err);
    return [];
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Get pricing
// Response shape: array of price objects
// Each: { plan_name, plan_tier, price_amount, currency, billing_period, monthly_equivalent }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getPricing(
  userId: string,
  serviceName: string
): Promise<AristoclesPricing | null> {
  const country = await getCountry(userId);

  // Find slug
  const services = await searchServices(userId, serviceName);
  console.log("[Aristocles] Search results for", serviceName, ":", services.length, "found", services.map(s => s.slug));
  const match =
    services.find((s) => s.name.toLowerCase() === serviceName.toLowerCase()) ||
    services.find((s) => s.name.toLowerCase().includes(serviceName.toLowerCase())) ||
    services[0];
  if (!match) { console.log("[Aristocles] No match found for", serviceName); return null; }
  console.log("[Aristocles] Using slug:", match.slug, "country:", country);

  try {
    const data = await api(userId, `/prices/${match.slug}?country=${country}`);
    console.log("[Aristocles] Prices response:", JSON.stringify(data).slice(0, 300));
    const list = Array.isArray(data) ? data : [];
    if (list.length === 0) { console.log("[Aristocles] Empty price list"); return null; }

    // Group by plan_name — merge monthly and yearly into one plan
    const planMap = new Map<string, AristoclesPlan>();

    for (const p of list as Record<string, unknown>[]) {
      const name = String(p.plan_name || p.name || "Plan");
      const amount = Number(p.price_amount || p.price || 0);
      const currency = String(p.currency || "USD");
      const period = String(p.billing_period || "monthly").toLowerCase();

      const existing = planMap.get(name) || {
        name,
        monthly_price: null,
        yearly_price: null,
        currency,
        features: [],
      };

      if (period.includes("year") || period.includes("annual")) {
        existing.yearly_price = amount;
      } else {
        existing.monthly_price = amount;
      }

      // Use monthly_equivalent if available
      if (p.monthly_equivalent && !existing.monthly_price) {
        existing.monthly_price = Number(p.monthly_equivalent);
      }

      planMap.set(name, existing);
    }

    return {
      service_name: match.name,
      plans: Array.from(planMap.values()),
      source: "aristocles",
    };
  } catch {
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Alternatives
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getAlternatives(
  userId: string,
  serviceName: string
): Promise<{ name: string; slug: string; cheapest_price: number; currency: string }[]> {
  const country = await getCountry(userId);
  const services = await searchServices(userId, serviceName);
  if (services.length === 0) return [];

  try {
    const data = await api(userId, `/alternatives/${services[0].slug}?country=${country}&limit=5`);
    const items = Array.isArray(data) ? data : (data as Record<string, unknown>).alternatives || [];
    if (!Array.isArray(items)) return [];

    return items.map((a: Record<string, unknown>) => ({
      name: String(a.name || a.service_name || ""),
      slug: String(a.slug || ""),
      cheapest_price: Number(a.cheapest_price || a.cheapest_monthly || a.price || 0),
      currency: String(a.currency || "USD"),
    }));
  } catch {
    return [];
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Categories
// Response: array of { id, name, slug, description, icon, service_count }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getCategories(
  userId: string
): Promise<{ slug: string; name: string; count: number }[]> {
  try {
    const data = await api(userId, "/categories");
    if (!Array.isArray(data)) return [];

    return data.map((c: Record<string, unknown>) => ({
      slug: String(c.slug || ""),
      name: String(c.name || ""),
      count: Number(c.service_count || c.count || 0),
    }));
  } catch {
    return [];
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// List by country
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function listByCountry(
  userId: string,
  category?: string
): Promise<{ name: string; slug: string; category: string; cheapest_price: number; currency: string }[]> {
  const country = await getCountry(userId);
  let path = `/services/by-country/${country}`;
  if (category) path += `?category=${encodeURIComponent(category)}`;

  try {
    const data = await api(userId, path);
    if (!Array.isArray(data)) return [];

    return data.map((s: Record<string, unknown>) => ({
      name: String(s.name || ""),
      slug: String(s.slug || ""),
      category: String(s.category || s.category_name || ""),
      cheapest_price: Number(s.cheapest_price || s.cheapest_monthly || s.price || 0),
      currency: String(s.currency || "USD"),
    }));
  } catch {
    return [];
  }
}
