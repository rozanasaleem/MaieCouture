"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { getPreferredCountry } from "@/lib/country-client";
import { COUNTRY_UPDATED_EVENT, DEFAULT_COUNTRY } from "@/lib/country-shared";
import { CURRENCY_UPDATED_EVENT, getDefaultDisplayCurrencyForCountry, getPreferredDisplayCurrency } from "@/lib/currency-client";

const DetectedCountryContext = createContext(DEFAULT_COUNTRY);

export function StorePreferences({ country, children }: { country: string; children: React.ReactNode }) {
  return <DetectedCountryContext.Provider value={country}>{children}</DetectedCountryContext.Provider>;
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(COUNTRY_UPDATED_EVENT, listener);
  window.addEventListener(CURRENCY_UPDATED_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(COUNTRY_UPDATED_EVENT, listener);
    window.removeEventListener(CURRENCY_UPDATED_EVENT, listener);
  };
}

export function usePreferredCountry() {
  const detected = useContext(DetectedCountryContext);
  return useSyncExternalStore(subscribe, () => getPreferredCountry(detected), () => detected);
}

export function usePreferredCurrency() {
  const detected = useContext(DetectedCountryContext);
  return useSyncExternalStore(subscribe, () => getPreferredDisplayCurrency(detected), () => getDefaultDisplayCurrencyForCountry(detected));
}
