"use client";

import { useMemo, useState } from "react";
import { ModalShell } from "@/components/modal-shell";
import { Locale } from "@/lib/i18n-shared";

const STORAGE_KEY = "maie_selected_country";
const FALLBACK_COUNTRY = "PS";

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

function buildRegionCodesFromPairs() {
  const regionCodes: string[] = [];
  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      regionCodes.push(`${String.fromCharCode(first)}${String.fromCharCode(second)}`);
    }
  }
  return regionCodes;
}

function buildCountryOptions(displayLocale: "en" | "ar") {
  const intlWithRegions = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };

  if (typeof Intl === "undefined" || typeof Intl.DisplayNames !== "function") {
    return displayLocale === "ar" ? fallbackCountryOptionsAr : fallbackCountryOptionsEn;
  }

  const names = new Intl.DisplayNames([displayLocale], { type: "region" });
  let regionCodes: string[] = [];

  try {
    if (typeof intlWithRegions.supportedValuesOf === "function") {
      regionCodes = intlWithRegions
        .supportedValuesOf("region")
        .filter((code) => /^[A-Z]{2}$/.test(code));
    } else {
      regionCodes = buildRegionCodesFromPairs();
    }
  } catch {
    regionCodes = buildRegionCodesFromPairs();
  }

  const options = regionCodes
    .map((code) => ({
      code,
      name:
        code === "PS"
          ? displayLocale === "ar"
            ? "فلسطين"
            : "Palestine"
          : (names.of(code) ?? code),
    }))
    .filter((option) => option.code !== "IL")
    .filter((option) => option.name !== option.code)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!options.some((option) => option.code === "PS")) {
    options.push({
      code: "PS",
      name: displayLocale === "ar" ? "فلسطين" : "Palestine",
    });
    options.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (options.length > 0) {
    return options;
  }
  return displayLocale === "ar" ? fallbackCountryOptionsAr : fallbackCountryOptionsEn;
}

const countryOptionsEn = buildCountryOptions("en");
const countryOptionsAr = buildCountryOptions("ar");

function normalizeStoredCountryCode(raw: string | null): string | null {
  if (!raw) {
    return null;
  }

  const upper = raw.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) {
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
  return byArabicName?.code ?? null;
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
  const isArabic = locale === "ar";
  const countryOptions = isArabic ? countryOptionsAr : countryOptionsEn;
  const [countryCode, setCountryCode] = useState(() => {
    if (typeof window === "undefined") {
      return FALLBACK_COUNTRY;
    }
    const saved = normalizeStoredCountryCode(window.localStorage.getItem(STORAGE_KEY));
    if (saved) {
      window.localStorage.setItem(STORAGE_KEY, saved);
      return saved;
    }
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const parsed = locale.split("-")[1]?.toUpperCase();
    const supported = countryOptionsEn.some((option) => option.code === parsed);
    const initial = supported && parsed ? parsed : FALLBACK_COUNTRY;
    window.localStorage.setItem(STORAGE_KEY, initial);
    return initial;
  });

  const selectedCountryLabel = useMemo(() => {
    return countryOptions.find((option) => option.code === countryCode)?.name ?? "Country";
  }, [countryCode, countryOptions]);

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
    setCountryCode(code);
    window.localStorage.setItem(STORAGE_KEY, code);
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
        title={isArabic ? "اختر البلد" : "Select Country"}
        closeLabel={isArabic ? "إغلاق" : "Close"}
      >
        <p className="mb-4 text-sm text-[--muted]">
          {isArabic
            ? "اختر بلدك لتوضيح الشحن وتجربة الدفع."
            : "Choose your country for shipping context and checkout clarity."}
        </p>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={isArabic ? "ابحث عن البلد" : "Search country"}
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
            {isArabic ? "متابعة التصفح" : "Continue browsing"}
          </button>
        </div>
      </ModalShell>
    </>
  );
}
