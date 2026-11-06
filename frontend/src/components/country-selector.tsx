"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { ModalShell } from "@/components/modal-shell";
import { Locale, t } from "@/lib/i18n-shared";
import { isShippingCountry, SHIPPING_COUNTRY_CODES } from "@/lib/shipping-countries";

const STORAGE_KEY = "maie_selected_country";
const FALLBACK_COUNTRY = "PS";

function subscribeCountry(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("maie-country-updated", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("maie-country-updated", listener);
  };
}

function readCountry() {
  const saved = normalizeStoredCountryCode(window.localStorage.getItem(STORAGE_KEY));
  if (saved) return saved;
  const region = Intl.DateTimeFormat().resolvedOptions().locale.split("-")[1]?.toUpperCase();
  return region && countryOptionsEn.some((option) => option.code === region) ? region : FALLBACK_COUNTRY;
}

const fallbackCountryOptionsEn = [
  { code: "PS", name: "Palestine" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AE", name: "United Arab Emirates" },
];

const fallbackCountryOptionsAr = [
  { code: "PS", name: "فلسطين" },
  { code: "US", name: "الولايات المتحدة" },
  { code: "GB", name: "المملكة المتحدة" },
  { code: "AE", name: "الإمارات العربية المتحدة" },
];

const fallbackCountryOptionsEs = [
  { code: "PS", name: "Palestina" },
  { code: "US", name: "Estados Unidos" },
  { code: "GB", name: "Reino Unido" },
  { code: "AE", name: "Emiratos Arabes Unidos" },
];

function buildCountryOptions(displayLocale: "en" | "ar" | "es") {
  if (typeof Intl === "undefined" || typeof Intl.DisplayNames !== "function") {
    if (displayLocale === "ar") {
      return fallbackCountryOptionsAr;
    }
    if (displayLocale === "es") {
      return fallbackCountryOptionsEs;
    }
    return fallbackCountryOptionsEn;
  }

  const names = new Intl.DisplayNames([displayLocale], { type: "region" });
  const options = SHIPPING_COUNTRY_CODES
    .map((code) => ({
      code,
      name:
        code === "PS"
          ? displayLocale === "ar"
            ? "فلسطين"
            : displayLocale === "es"
              ? "Palestina"
              : "Palestine"
          : (names.of(code) ?? code),
    }))
    .filter((option) => option.code !== "IL")
    .filter((option) => option.name !== option.code)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!options.some((option) => option.code === "PS")) {
    options.push({
      code: "PS",
      name:
        displayLocale === "ar"
          ? "فلسطين"
          : displayLocale === "es"
            ? "Palestina"
            : "Palestine",
    });
    options.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (options.length > 0) {
    return options;
  }
  if (displayLocale === "ar") {
    return fallbackCountryOptionsAr;
  }
  if (displayLocale === "es") {
    return fallbackCountryOptionsEs;
  }
  return fallbackCountryOptionsEn;
}

const countryOptionsEn = buildCountryOptions("en");
const countryOptionsAr = buildCountryOptions("ar");
const countryOptionsEs = buildCountryOptions("es");

function normalizeStoredCountryCode(raw: string | null): string | null {
  if (!raw) {
    return null;
  }

  const upper = raw.trim().toUpperCase();
  if (isShippingCountry(upper)) {
    return upper;
  }

  const byName = countryOptionsEn.find(
    (option) => option.name.toLowerCase() === raw.trim().toLowerCase(),
  );
  if (byName?.code) {
    return byName.code;
  }
  const byArabicName = countryOptionsAr.find(
    (option) => option.name.toLowerCase() === raw.trim().toLowerCase(),
  );
  if (byArabicName?.code) {
    return byArabicName.code;
  }
  const bySpanishName = countryOptionsEs.find(
    (option) => option.name.toLowerCase() === raw.trim().toLowerCase(),
  );
  return bySpanishName?.code ?? null;
}

export function CountrySelector({
  compact = false,
  subtle = false,
  locale = "en",
  lightOnDark = false,
}: {
  compact?: boolean;
  subtle?: boolean;
  locale?: Locale;
  lightOnDark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const countryOptions =
    locale === "ar" ? countryOptionsAr : locale === "es" ? countryOptionsEs : countryOptionsEn;
  const countryCode = useSyncExternalStore(subscribeCountry, readCountry, () => FALLBACK_COUNTRY);

  const selectedCountryLabel = useMemo(() => {
    return (
      countryOptions.find((option) => option.code === countryCode)?.name ??
      t(locale, {
        en: "Country",
        ar: "البلد",
        es: "Pais",
      })
    );
  }, [countryCode, countryOptions, locale]);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return countryOptions;
    }
    return countryOptions.filter(
      (option) =>
        option.name.toLowerCase().includes(query) ||
        option.code.toLowerCase().includes(query),
    );
  }, [countryOptions, search]);

  function chooseCountry(code: string) {
    window.localStorage.setItem(STORAGE_KEY, code);
    window.dispatchEvent(new Event("maie-country-updated"));
    setOpen(false);
  }

  return (
    <>
      {subtle ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`text-left transition-opacity hover:opacity-80 ${
            lightOnDark ? "!text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.45)]" : "text-[--ink]"
          }`}
        >
          <p className={`leading-none underline underline-offset-4 ${lightOnDark ? "text-[10px]" : "text-[11px]"}`}>
            {selectedCountryLabel}
          </p>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`rounded-full border border-[--line] uppercase text-[--ink] transition hover:bg-[--stone] ${
            compact
              ? "px-2.5 py-1.5 text-[9px] tracking-[0.12em] sm:px-3 sm:text-[10px]"
              : "px-3 py-2 text-[10px] tracking-[0.14em] sm:px-4 sm:text-[11px]"
          }`}
        >
          {countryCode} · {selectedCountryLabel}
        </button>
      )}

      <ModalShell
        open={open}
        onClose={() => setOpen(false)}
        title={t(locale, {
          en: "Select Country",
          ar: "اختر البلد",
          es: "Seleccionar pais",
        })}
        closeLabel={t(locale, {
          en: "Close",
          ar: "إغلاق",
          es: "Cerrar",
        })}
      >
        <p className="mb-4 text-sm text-[--muted]">
          {t(locale, {
            en: "Choose your country for shipping context and checkout clarity.",
            ar: "اختر بلدك لتوضيح الشحن وتجربة الدفع.",
            es: "Elige tu pais para aclarar el envio y la experiencia de pago.",
          })}
        </p>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t(locale, {
            en: "Search country",
            ar: "ابحث عن البلد",
            es: "Buscar pais",
          })}
          className="mb-4 w-full rounded-xl border border-[--line] px-4 py-3 text-sm text-[--ink] outline-none focus:border-[--ink]"
        />
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {filteredOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => chooseCountry(option.code)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                countryCode === option.code
                  ? "border-[--ink] bg-[--stone] text-[--ink]"
                  : "border-[--line] text-[--muted] hover:bg-[--sand]"
              }`}
            >
              <span>{option.name}</span>
              <span className="text-xs tracking-[0.2em] uppercase">{option.code}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-[--line] px-4 py-2 text-[11px] tracking-[0.16em] uppercase text-[--ink] transition hover:bg-[--stone]"
          >
            {t(locale, {
              en: "Continue browsing",
              ar: "متابعة التصفح",
              es: "Seguir navegando",
            })}
          </button>
        </div>
      </ModalShell>
    </>
  );
}
