"use client";

import { useMemo, useRef, useSyncExternalStore } from "react";
import {
  getPreferredDisplayCurrency,
  setPreferredDisplayCurrency,
  SupportedCurrency,
} from "@/lib/currency-client";
import { Locale, t } from "@/lib/i18n-shared";

const CURRENCY_OPTIONS: Array<{
  code: SupportedCurrency;
  shortLabel: string;
  en: string;
  ar: string;
  es: string;
}> = [
  { code: "ILS", shortLabel: "NIS", en: "Israeli Shekel", ar: "شيكل", es: "Shekel israeli" },
  { code: "USD", shortLabel: "USD", en: "US Dollar", ar: "دولار أمريكي", es: "Dolar estadounidense" },
  { code: "EUR", shortLabel: "EUR", en: "Euro", ar: "يورو", es: "Euro" },
  { code: "JOD", shortLabel: "JOD", en: "Jordanian Dinar", ar: "دينار أردني", es: "Dinar jordano" },
];

function subscribeCurrency(listener: () => void) {
  window.addEventListener("maie-currency-updated", listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener("maie-currency-updated", listener);
    window.removeEventListener("storage", listener);
  };
}

export function CurrencySelector({
  subtle = false,
  locale = "en",
  lightOnDark = false,
}: {
  subtle?: boolean;
  locale?: Locale;
  lightOnDark?: boolean;
}) {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const currency = useSyncExternalStore(subscribeCurrency, getPreferredDisplayCurrency, () => "USD" as SupportedCurrency);

  const selected = useMemo(
    () => CURRENCY_OPTIONS.find((option) => option.code === currency) ?? CURRENCY_OPTIONS[1],
    [currency],
  );

  function chooseCurrency(nextCurrency: SupportedCurrency) {
    setPreferredDisplayCurrency(nextCurrency);
    detailsRef.current?.removeAttribute("open");
  }

  return (
    <details ref={detailsRef} className="group relative">
      <summary
        className={`cursor-pointer list-none transition-opacity hover:opacity-80 [&::-webkit-details-marker]:hidden ${
          subtle
            ? lightOnDark
              ? "!text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.45)]"
              : "text-[--ink]"
            : lightOnDark
              ? "rounded-full border border-white/60 px-3 py-1 text-white hover:bg-white/12"
              : "rounded-full border border-[--line] px-3 py-1 text-[--ink] hover:bg-[--stone]"
        }`}
        aria-label={t(locale, { en: "Currency", ar: "العملة", es: "Moneda" })}
      >
        <span className={subtle ? "text-[11px] leading-none underline underline-offset-4" : "text-[10px] tracking-[0.14em] uppercase"}>
          {selected.shortLabel}
        </span>
      </summary>

      <div className="absolute left-0 top-full z-50 mt-3 min-w-44 rounded-xl border border-[--line] bg-white p-2 text-[#171513] shadow-[0_18px_48px_rgba(32,25,21,0.12)]">
        <p className="px-3 pb-2 pt-1 text-[10px] tracking-[0.18em] uppercase text-[--muted]">
          {t(locale, { en: "Currency", ar: "العملة", es: "Moneda" })}
        </p>
        <div className="space-y-1">
          {CURRENCY_OPTIONS.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => chooseCurrency(option.code)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                currency === option.code ? "bg-[--stone] text-[--ink]" : "text-[--muted] hover:bg-[--stone]"
              }`}
            >
              <span>{locale === "ar" ? option.ar : locale === "es" ? option.es : option.en}</span>
              <span className="text-[10px] tracking-[0.14em] uppercase">{option.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}
