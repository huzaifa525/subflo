/**
 * Maps messy service names from emails/SMS to clean names, categories, and websites
 * This is the single source of truth for service identification
 */

interface ServiceMapping {
  name: string;
  website: string;
  category: string;
}

// Fuzzy matching rules — key is a regex pattern, value is the clean mapping
const MAPPINGS: [RegExp, ServiceMapping][] = [
  // Streaming
  [/netflix/i, { name: "Netflix", website: "https://netflix.com", category: "entertainment" }],
  [/disney.*\+|hotstar/i, { name: "Disney+ Hotstar", website: "https://hotstar.com", category: "entertainment" }],
  [/jiocinema/i, { name: "JioCinema", website: "https://jiocinema.com", category: "entertainment" }],
  [/sonyliv/i, { name: "SonyLIV", website: "https://sonyliv.com", category: "entertainment" }],
  [/zee5/i, { name: "ZEE5", website: "https://zee5.com", category: "entertainment" }],
  [/amazon.*prime|prime.*video/i, { name: "Amazon Prime", website: "https://amazon.in", category: "shopping" }],

  // Music
  [/spotify/i, { name: "Spotify", website: "https://spotify.com", category: "music" }],
  [/apple.*music/i, { name: "Apple Music", website: "https://music.apple.com", category: "music" }],
  [/youtube.*music/i, { name: "YouTube Music", website: "https://music.youtube.com", category: "music" }],
  [/youtube.*premium|youtube\s*$/i, { name: "YouTube Premium", website: "https://youtube.com", category: "entertainment" }],

  // AI / Productivity
  [/claude|anthropic/i, { name: "Claude", website: "https://claude.ai", category: "productivity" }],
  [/chatgpt|openai/i, { name: "ChatGPT", website: "https://openai.com", category: "productivity" }],
  [/perplexity/i, { name: "Perplexity", website: "https://perplexity.ai", category: "productivity" }],
  [/midjourney/i, { name: "Midjourney", website: "https://midjourney.com", category: "productivity" }],
  [/notion/i, { name: "Notion", website: "https://notion.so", category: "productivity" }],
  [/canva/i, { name: "Canva", website: "https://canva.com", category: "productivity" }],
  [/grammarly/i, { name: "Grammarly", website: "https://grammarly.com", category: "productivity" }],
  [/adobe|creative.*cloud/i, { name: "Adobe Creative Cloud", website: "https://adobe.com", category: "productivity" }],
  [/linkedin.*premium/i, { name: "LinkedIn Premium", website: "https://linkedin.com", category: "productivity" }],

  // Developer
  [/github.*copilot/i, { name: "GitHub Copilot", website: "https://github.com", category: "developer" }],
  [/github/i, { name: "GitHub", website: "https://github.com", category: "developer" }],
  [/cursor/i, { name: "Cursor", website: "https://cursor.com", category: "developer" }],
  [/figma/i, { name: "Figma", website: "https://figma.com", category: "developer" }],
  [/linear/i, { name: "Linear", website: "https://linear.app", category: "developer" }],
  [/vercel/i, { name: "Vercel", website: "https://vercel.com", category: "cloud" }],
  [/openrouter/i, { name: "OpenRouter", website: "https://openrouter.ai", category: "developer" }],

  // Cloud
  [/digitalocean/i, { name: "DigitalOcean", website: "https://digitalocean.com", category: "cloud" }],
  [/railway/i, { name: "Railway", website: "https://railway.app", category: "cloud" }],
  [/google.*one/i, { name: "Google One", website: "https://one.google.com", category: "cloud" }],
  [/icloud/i, { name: "iCloud+", website: "https://apple.com/icloud", category: "cloud" }],
  [/dropbox/i, { name: "Dropbox", website: "https://dropbox.com", category: "cloud" }],

  // Communication
  [/slack/i, { name: "Slack", website: "https://slack.com", category: "productivity" }],
  [/zoom/i, { name: "Zoom", website: "https://zoom.us", category: "productivity" }],
  [/microsoft.*365|office.*365/i, { name: "Microsoft 365", website: "https://microsoft.com", category: "productivity" }],

  // Security
  [/nordvpn/i, { name: "NordVPN", website: "https://nordvpn.com", category: "productivity" }],
  [/1password/i, { name: "1Password", website: "https://1password.com", category: "productivity" }],

  // Telecom
  [/jio(?!cinema|home)/i, { name: "Jio", website: "https://jio.com", category: "telecom" }],
  [/jiohome|jio.*fiber|jio.*fixed/i, { name: "JioFiber", website: "https://jio.com", category: "telecom" }],
  [/airtel/i, { name: "Airtel", website: "https://airtel.in", category: "telecom" }],

  // Food
  [/swiggy/i, { name: "Swiggy One", website: "https://swiggy.com", category: "shopping" }],
  [/zomato/i, { name: "Zomato Gold", website: "https://zomato.com", category: "shopping" }],

  // Shopping
  [/flipkart/i, { name: "Flipkart Plus", website: "https://flipkart.com", category: "shopping" }],
];

export function mapServiceName(rawName: string): ServiceMapping | null {
  for (const [pattern, mapping] of MAPPINGS) {
    if (pattern.test(rawName)) return mapping;
  }
  return null;
}

// Also check email sender domain for service identification
export function mapFromEmailSender(from: string): ServiceMapping | null {
  const domain = from.match(/@([a-z0-9.-]+)/i)?.[1]?.toLowerCase() || "";

  const DOMAIN_MAP: Record<string, ServiceMapping> = {
    "netflix.com": { name: "Netflix", website: "https://netflix.com", category: "entertainment" },
    "account.netflix.com": { name: "Netflix", website: "https://netflix.com", category: "entertainment" },
    "spotify.com": { name: "Spotify", website: "https://spotify.com", category: "music" },
    "youtube.com": { name: "YouTube Premium", website: "https://youtube.com", category: "entertainment" },
    "google.com": { name: "Google", website: "https://google.com", category: "cloud" },
    "anthropic.com": { name: "Claude", website: "https://claude.ai", category: "productivity" },
    "openai.com": { name: "ChatGPT", website: "https://openai.com", category: "productivity" },
    "apple.com": { name: "Apple", website: "https://apple.com", category: "productivity" },
    "amazon.in": { name: "Amazon", website: "https://amazon.in", category: "shopping" },
    "amazon.com": { name: "Amazon", website: "https://amazon.com", category: "shopping" },
    "jio.com": { name: "Jio", website: "https://jio.com", category: "telecom" },
    "microsoft.com": { name: "Microsoft", website: "https://microsoft.com", category: "productivity" },
    "github.com": { name: "GitHub", website: "https://github.com", category: "developer" },
  };

  // Check exact domain
  if (DOMAIN_MAP[domain]) return DOMAIN_MAP[domain];

  // Check parent domain
  const parts = domain.split(".");
  if (parts.length > 2) {
    const parent = parts.slice(-2).join(".");
    if (DOMAIN_MAP[parent]) return DOMAIN_MAP[parent];
  }

  return null;
}
