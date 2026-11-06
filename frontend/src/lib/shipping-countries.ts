import countryCodes from "../../../src/main/resources/shipping-countries.json";

export const SHIPPING_COUNTRY_CODES: readonly string[] = countryCodes;
const supportedCountries = new Set(SHIPPING_COUNTRY_CODES);

export function isShippingCountry(code: string): boolean {
  return supportedCountries.has(code);
}
