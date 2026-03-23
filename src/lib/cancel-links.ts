// Direct cancellation page URLs for popular services
const CANCEL_URLS: Record<string, string> = {
  netflix: "https://www.netflix.com/cancelplan",
  spotify: "https://www.spotify.com/account/subscription/",
  "youtube premium": "https://www.youtube.com/paid_memberships",
  "amazon prime": "https://www.amazon.in/gp/primecentral",
  "disney+ hotstar": "https://www.hotstar.com/in/account/subscription",
  hotstar: "https://www.hotstar.com/in/account/subscription",
  chatgpt: "https://chat.openai.com/#settings/subscription",
  claude: "https://claude.ai/settings/billing",
  "github copilot": "https://github.com/settings/copilot",
  notion: "https://www.notion.so/my-account/plans",
  figma: "https://www.figma.com/settings#billing",
  canva: "https://www.canva.com/settings/billing",
  grammarly: "https://account.grammarly.com/subscription",
  "linkedin premium": "https://www.linkedin.com/mypreferences/d/categories/subscriptions",
  cursor: "https://www.cursor.com/settings",
  midjourney: "https://www.midjourney.com/account/",
  perplexity: "https://www.perplexity.ai/settings/account",
  nordvpn: "https://my.nordaccount.com/dashboard/nordvpn/",
  "1password": "https://my.1password.com/settings/billing",
  dropbox: "https://www.dropbox.com/account/plan",
  "adobe creative cloud": "https://account.adobe.com/plans",
  slack: "https://slack.com/plans",
  zoom: "https://zoom.us/account",
  "apple music": "https://support.apple.com/en-us/HT202039",
  "icloud+": "https://support.apple.com/en-us/HT207594",
  "google one": "https://one.google.com/settings",
  jiocinema: "https://www.jiocinema.com/settings",
  sonyliv: "https://www.sonyliv.com/myaccount",
  zee5: "https://www.zee5.com/myaccount/subscription",
};

export function getCancelUrl(serviceName: string): string | null {
  const key = serviceName.toLowerCase().trim();
  return CANCEL_URLS[key] || null;
}
