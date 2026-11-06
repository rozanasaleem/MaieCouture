export type Locale = "en" | "ar" | "es";

export const LOCALE_COOKIE_KEY = "maie_locale";

export function normalizeLocale(value: string | undefined | null): Locale {
  if (value === "ar") {
    return "ar";
  }
  if (value === "es") {
    return "es";
  }
  return "en";
}

export function getDirection(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export function t(
  locale: Locale,
  copy: {
    en: string;
    ar: string;
    es?: string;
  },
) {
  if (locale === "ar") {
    return copy.ar;
  }
  if (locale === "es") {
    return copy.es ?? copy.en;
  }
  return copy.en;
}
