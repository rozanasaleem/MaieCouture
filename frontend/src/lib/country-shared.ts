import { isShippingCountry } from "@/lib/shipping-countries";

export const DEFAULT_COUNTRY = "PS";
export const COUNTRY_STORAGE_KEY = "maie_selected_country";
export const COUNTRY_UPDATED_EVENT = "maie-country-updated";

export function normalizeCountryCode(value: string | null): string | null {
  const code = value?.trim().toUpperCase();
  return code && /^[A-Z]{2}$/.test(code) && code !== "IL" && isShippingCountry(code) ? code : null;
}
