/**
 * Pricing scraper — uses Aristocles API only
 */

export { getPricing as scrapePricingForService } from "./aristocles";
export type { AristoclesPlan as ScrapedPlan, AristoclesPricing as ScrapedPricing } from "./aristocles";
