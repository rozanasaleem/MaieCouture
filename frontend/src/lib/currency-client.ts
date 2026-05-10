"use client";

import { getLocaleFromDocument } from "@/lib/i18n-client";

export const COUNTRY_STORAGE_KEY = "maie_selected_country";

export type SupportedCurrency = "USD" | "ILS";
export type DisplayMoney = {
  amount: number;
  currency: SupportedCurrency;
  estimated: boolean;
};

function readSelectedCountry(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(COUNTRY_STORAGE_KEY);
}

export function getPreferredDisplayCurrency(): SupportedCurrency {
  const country = readSelectedCountry();
  if (country === "PS") {
    return "ILS";
  }
  return "USD";
}

export function getFxRateIlsPerUsd(): number | null {
  const raw = process.env.NEXT_PUBLIC_ILS_PER_USD;
  if (!raw) {
    return 3.65;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 3.65;
  }
  return parsed;
}

export function formatMoney(value: number, currency: SupportedCurrency) {
  const locale = getLocaleFromDocument();
  const intlLocale = locale === "ar" ? "ar-PS-u-nu-latn" : "en-US";
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    numberingSystem: "latn",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function estimateIlsFromUsd(usdAmount: number): number | null {
  const rate = getFxRateIlsPerUsd();
  if (rate == null) {
    return null;
  }
  return Number((usdAmount * rate).toFixed(2));
}

export function toDisplayMoney(
  amount: number,
  baseCurrency: string,
): DisplayMoney {
  const normalizedBase = normalizeCurrency(baseCurrency);
  const preferredCurrency = getPreferredDisplayCurrency();

  if (normalizedBase === "USD" && preferredCurrency === "ILS") {
    const converted = estimateIlsFromUsd(amount);
    if (converted != null) {
      return {
        amount: converted,
        currency: "ILS",
        estimated: true,
      };
    }
  }

  if (normalizedBase === "ILS") {
    return {
      amount,
      currency: "ILS",
      estimated: false,
    };
  }

  return {
    amount,
    currency: "USD",
    estimated: false,
  };
}

function normalizeCurrency(value: string): SupportedCurrency {
  const code = (value || "").trim().toUpperCase();
  if (code === "ILS" || code === "NIS") {
    return "ILS";
  }
  return "USD";
}
