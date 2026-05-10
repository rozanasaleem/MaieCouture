export type Locale = "en" | "ar";

export const LOCALE_COOKIE_KEY = "maie_locale";

export function normalizeLocale(value: string | undefined | null): Locale {
  return value === "ar" ? "ar" : "en";
}

export function getDirection(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}
