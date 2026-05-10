"use client";

import { Locale, LOCALE_COOKIE_KEY, normalizeLocale } from "@/lib/i18n-shared";

export type { Locale };

export function getLocaleFromDocument(): Locale {
  if (typeof document === "undefined") {
    return "en";
  }
  const value = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${LOCALE_COOKIE_KEY}=`))
    ?.split("=")[1];
  return normalizeLocale(value);
}

export function setLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}
