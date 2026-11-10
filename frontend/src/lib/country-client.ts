"use client";

import { COUNTRY_STORAGE_KEY, COUNTRY_UPDATED_EVENT, DEFAULT_COUNTRY, normalizeCountryCode } from "@/lib/country-shared";
import { SHIPPING_COUNTRY_CODES } from "@/lib/shipping-countries";

function savedCountry(): string | null {
  const raw = window.localStorage.getItem(COUNTRY_STORAGE_KEY);
  const code = normalizeCountryCode(raw);
  if (code || !raw) return code;
  const name = raw.trim().toLowerCase();
  if (["palestine", "palestina", "فلسطين"].includes(name)) return "PS";
  if (typeof Intl.DisplayNames === "function") {
    for (const locale of ["en", "ar", "es"]) {
      const names = new Intl.DisplayNames([locale], { type: "region" });
      const match = SHIPPING_COUNTRY_CODES.find(country => country !== "IL" && names.of(country)?.toLowerCase() === name);
      if (match) return match;
    }
  }
  return null;
}

export function getPreferredCountry(detectedCountry?: string): string {
  const detected = detectedCountry ?? (typeof document === "undefined" ? null : document.documentElement.dataset.country);
  const fallback = normalizeCountryCode(detected ?? null) ?? DEFAULT_COUNTRY;
  return typeof window === "undefined" ? fallback : savedCountry() ?? fallback;
}

export function setPreferredCountry(value: string) {
  const code = normalizeCountryCode(value);
  if (!code || typeof window === "undefined") return;
  window.localStorage.setItem(COUNTRY_STORAGE_KEY, code);
  window.dispatchEvent(new Event(COUNTRY_UPDATED_EVENT));
  window.dispatchEvent(new Event("maie-currency-updated"));
}
