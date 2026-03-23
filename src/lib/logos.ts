// Service logo fetching with Clearbit + Google Favicon fallback

export function getClearbitLogo(domain: string): string {
  const clean = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return `https://logo.clearbit.com/${clean}`;
}

export function getGoogleFavicon(domain: string, size: number = 64): string {
  const clean = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return `https://www.google.com/s2/favicons?domain=${clean}&sz=${size}`;
}

export function getServiceLogo(website: string | null | undefined): {
  primary: string;
  fallback: string;
} | null {
  if (!website) return null;
  const domain = website.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return {
    primary: getClearbitLogo(domain),
    fallback: getGoogleFavicon(domain, 64),
  };
}
