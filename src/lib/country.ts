// REST Countries API — auto-detect currency from country/IP

const API_URL = "https://restcountries.com/v3.1";

interface CountryData {
  name: { common: string };
  currencies: Record<string, { name: string; symbol: string }>;
  cca2: string;
}

let countriesCache: CountryData[] | null = null;

export async function getAllCountries(): Promise<CountryData[]> {
  if (countriesCache) return countriesCache;

  const res = await fetch(`${API_URL}/all?fields=name,currencies,cca2`, {
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return [];
  countriesCache = await res.json();
  return countriesCache!;
}

export async function getCurrencyByCountryCode(
  code: string
): Promise<{ code: string; name: string; symbol: string } | null> {
  try {
    const res = await fetch(`${API_URL}/alpha/${code}?fields=currencies`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const currencies = data.currencies;
    if (!currencies) return null;

    const currCode = Object.keys(currencies)[0];
    return {
      code: currCode,
      name: currencies[currCode].name,
      symbol: currencies[currCode].symbol,
    };
  } catch {
    return null;
  }
}

export async function detectCurrencyFromIP(): Promise<string> {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return "USD";
    const data = await res.json();
    return data.currency || "USD";
  } catch {
    return "USD";
  }
}

export async function getCurrencyList(): Promise<
  { code: string; name: string; symbol: string; country: string }[]
> {
  const countries = await getAllCountries();
  const seen = new Set<string>();
  const result: { code: string; name: string; symbol: string; country: string }[] = [];

  for (const c of countries) {
    if (!c.currencies) continue;
    for (const [code, info] of Object.entries(c.currencies)) {
      if (seen.has(code)) continue;
      seen.add(code);
      result.push({
        code,
        name: info.name,
        symbol: info.symbol,
        country: c.name.common,
      });
    }
  }

  return result.sort((a, b) => a.code.localeCompare(b.code));
}
