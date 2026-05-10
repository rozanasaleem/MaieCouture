import { cookies } from "next/headers";
import { Locale, LOCALE_COOKIE_KEY, getDirection, normalizeLocale } from "@/lib/i18n-shared";

export { getDirection };
export type { Locale };

export async function getLocaleFromCookies(): Promise<Locale> {
  const store = await cookies();
  return normalizeLocale(store.get(LOCALE_COOKIE_KEY)?.value);
}
