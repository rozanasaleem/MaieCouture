"use client";

import { useRouter } from "next/navigation";
import { Locale, setLocaleCookie } from "@/lib/i18n-client";

export function LanguageSwitcher({
  locale,
  lightOnDark = false,
}: {
  locale: Locale;
  lightOnDark?: boolean;
}) {
  const router = useRouter();

  function switchLocale(nextLocale: Locale) {
    if (nextLocale === locale) {
      return;
    }
    setLocaleCookie(nextLocale);
    router.refresh();
  }

  return (
    <div
      className={`flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase ${
        lightOnDark
          ? "!text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.45)] text-[9px]"
          : "text-[--muted]"
      }`}
    >
      <button
        type="button"
        onClick={() => switchLocale("en")}
        className={`rounded px-1.5 py-0.5 transition ${
          locale === "en"
            ? lightOnDark
              ? "text-white"
              : "text-[--ink]"
            : lightOnDark
              ? "hover:text-white"
              : "hover:text-[--ink]"
        }`}
      >
        EN
      </button>
      <span>/</span>
      <button
        type="button"
        onClick={() => switchLocale("ar")}
        className={`rounded px-1.5 py-0.5 transition ${
          locale === "ar"
            ? lightOnDark
              ? "text-white"
              : "text-[--ink]"
            : lightOnDark
              ? "hover:text-white"
              : "hover:text-[--ink]"
        }`}
      >
        AR
      </button>
    </div>
  );
}
