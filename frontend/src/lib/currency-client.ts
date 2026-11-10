"use client";

import { getLocaleFromDocument } from "@/lib/i18n-client";
import { getPreferredCountry } from "@/lib/country-client";

export { COUNTRY_STORAGE_KEY } from "@/lib/country-shared";
export const DISPLAY_CURRENCY_STORAGE_KEY = "maie_display_currency";
export const CURRENCY_UPDATED_EVENT = "maie-currency-updated";

export type SupportedCurrency = "USD" | "ILS" | "EUR" | "JOD";
const EURO_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT",
  "LU", "MT", "NL", "PT", "SK", "SI", "ES", "AD", "MC", "SM", "VA", "ME", "XK",
]);
export type DisplayMoney = {
  amount: number;
  currency: SupportedCurrency;
  estimated: boolean;
};

function readSelectedCurrency(): SupportedCurrency | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY);
  if (!stored) {
    return null;
  }
  return normalizeCurrencyCode(stored);
}

export function getDefaultDisplayCurrencyForCountry(country: string | null): SupportedCurrency {
  if (country === "PS") return "ILS";
  if (country === "JO") return "JOD";
  if (EURO_COUNTRIES.has(country ?? "")) return "EUR";
  return "USD";
}

export function getPreferredDisplayCurrency(detectedCountry?: string): SupportedCurrency {
  const selectedCurrency = readSelectedCurrency();
  if (selectedCurrency) {
    return selectedCurrency;
  }
  const country = getPreferredCountry(detectedCountry);
  return getDefaultDisplayCurrencyForCountry(country);
}

export function setPreferredDisplayCurrency(currency: SupportedCurrency) {
  if (typeof window === "undefined") {
    return;
  }
  const normalized = normalizeCurrencyCode(currency);
  window.localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, normalized);
  window.dispatchEvent(new CustomEvent(CURRENCY_UPDATED_EVENT, { detail: normalized }));
}

export function clearPreferredDisplayCurrency() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(DISPLAY_CURRENCY_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CURRENCY_UPDATED_EVENT));
}

export function normalizeCurrencyCode(value: string): SupportedCurrency {
  const code = (value || "").trim().toUpperCase();
  if (code === "ILS" || code === "NIS") {
    return "ILS";
  }
  if (code === "EUR") {
    return "EUR";
  }
  if (code === "JOD") {
    return "JOD";
  }
  return "USD";
}

function getFxRateIlsForCurrency(currency: SupportedCurrency): number | null {
  const fallback =
    currency === "USD"
      ? 3.05
      : currency === "EUR"
        ? 3.45
        : currency === "JOD"
          ? 4.25
          : 1;

  const raw =
    currency === "USD"
      ? process.env.NEXT_PUBLIC_ILS_PER_USD
      : currency === "EUR"
        ? process.env.NEXT_PUBLIC_ILS_PER_EUR
        : currency === "JOD"
          ? process.env.NEXT_PUBLIC_ILS_PER_JOD
          : "1";
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function formatMoney(value: number, currency: SupportedCurrency) {
  const locale = getLocaleFromDocument();
  const intlLocale =
    locale === "ar"
      ? "ar-PS-u-nu-latn"
      : locale === "es"
        ? "es-ES"
        : "en-US";
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    numberingSystem: "latn",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function convertToIls(amount: number, currency: SupportedCurrency): number | null {
  if (currency === "ILS") {
    return amount;
  }
  const rate = getFxRateIlsForCurrency(currency);
  if (rate == null || !Number.isFinite(amount)) {
    return null;
  }
  return Number((amount * rate).toFixed(2));
}

function convertFromIls(ilsAmount: number, currency: SupportedCurrency): number | null {
  if (currency === "ILS") {
    return ilsAmount;
  }
  const rate = getFxRateIlsForCurrency(currency);
  if (rate == null || rate <= 0 || !Number.isFinite(ilsAmount)) {
    return null;
  }
  return Number((ilsAmount / rate).toFixed(2));
}

function convertMoney(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
): number | null {
  if (fromCurrency === toCurrency) {
    return Number(amount.toFixed(2));
  }
  const ilsAmount = convertToIls(amount, fromCurrency);
  if (ilsAmount == null) {
    return null;
  }
  return convertFromIls(ilsAmount, toCurrency);
}

export function convertMoneyValue(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): number | null {
  return convertMoney(
    amount,
    normalizeCurrencyCode(fromCurrency),
    normalizeCurrencyCode(toCurrency),
  );
}

export function sumMoneyInCurrency(
  lines: Array<{ amount: number; currency: string }>,
  targetCurrency: string,
): DisplayMoney {
  const normalizedTarget = normalizeCurrencyCode(targetCurrency);
  let total = 0;
  let estimated = false;

  for (const line of lines) {
    const normalizedLineCurrency = normalizeCurrencyCode(line.currency);
    const converted = convertMoney(line.amount, normalizedLineCurrency, normalizedTarget);
    total += converted ?? line.amount;
    if (normalizedLineCurrency !== normalizedTarget) {
      estimated = true;
    }
  }

  return {
    amount: Number(total.toFixed(2)),
    currency: normalizedTarget,
    estimated,
  };
}

export function toDisplayMoney(
  amount: number,
  baseCurrency: string,
  preferredCurrency: SupportedCurrency = getPreferredDisplayCurrency(),
): DisplayMoney {
  const normalizedBase = normalizeCurrencyCode(baseCurrency);

  if (normalizedBase === preferredCurrency) {
    return {
      amount,
      currency: preferredCurrency,
      estimated: false,
    };
  }

  const converted = convertMoney(amount, normalizedBase, preferredCurrency);
  if (converted != null) {
    return {
      amount: converted,
      currency: preferredCurrency,
      estimated: true,
    };
  }

  return {
    amount: Number(amount.toFixed(2)),
    currency: normalizedBase,
    estimated: false,
  };
}
