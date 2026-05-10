"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createOrder,
  initializeLahzaPayment,
  quoteShipping,
} from "@/lib/api";
import { cartBaseCurrency, cartSubtotal, clearCart, readCart } from "@/lib/cart";
import {
  formatMoney,
  toDisplayMoney,
} from "@/lib/currency-client";
import { getLocaleFromDocument } from "@/lib/i18n-client";

const DEFAULT_COUNTRY = "PS";
const COUNTRY_STORAGE_KEY = "maie_selected_country";

type CheckoutCountryOption = {
  code: string;
  name: string;
};

type PhoneCodeOption = {
  code: string;
  label: string;
};

const fallbackCountryOptions: CheckoutCountryOption[] = [
  { code: "PS", name: "Palestine" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AE", name: "United Arab Emirates" },
];

const PHONE_CODE_OPTIONS: PhoneCodeOption[] = [
  { code: "+970", label: "Palestine (+970)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+962", label: "Jordan (+962)" },
  { code: "+966", label: "Saudi (+966)" },
  { code: "+961", label: "Lebanon (+961)" },
  { code: "+20", label: "Egypt (+20)" },
  { code: "+1", label: "USA/Canada (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+33", label: "France (+33)" },
  { code: "+34", label: "Spain (+34)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+39", label: "Italy (+39)" },
  { code: "+90", label: "Turkey (+90)" },
  { code: "+7", label: "Kazakhstan/Russia (+7)" },
  { code: "+81", label: "Japan (+81)" },
  { code: "+82", label: "South Korea (+82)" },
  { code: "+86", label: "China (+86)" },
  { code: "+91", label: "India (+91)" },
  { code: "+92", label: "Pakistan (+92)" },
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

function buildCheckoutCountryOptions(): CheckoutCountryOption[] {
  if (typeof Intl === "undefined" || typeof Intl.DisplayNames !== "function") {
    return fallbackCountryOptions;
  }

  const intlWithRegions = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  const names = new Intl.DisplayNames(["en"], { type: "region" });

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
      name: names.of(code) ?? code,
    }))
    .filter((option) => option.code !== "IL")
    .filter((option) => option.name !== option.code)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!options.some((option) => option.code === "PS")) {
    options.push({ code: "PS", name: "Palestine" });
    options.sort((a, b) => a.name.localeCompare(b.name));
  }

  return options.length > 0 ? options : fallbackCountryOptions;
}

const checkoutCountryOptions = buildCheckoutCountryOptions();

function normalizeCountryCode(raw: string | null): string | null {
  if (!raw) {
    return null;
  }
  const upper = raw.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) {
    return upper;
  }
  if (upper === "PALESTINE" || raw.trim() === "فلسطين") {
    return "PS";
  }
  return null;
}

export default function CheckoutPage() {
  const [mounted, setMounted] = useState(false);
  const locale = mounted ? getLocaleFromDocument() : "en";
  const isArabic = locale === "ar";

  const [items, setItems] = useState(readCart());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+970");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setMounted(true);
    const savedCountry = normalizeCountryCode(
      window.localStorage.getItem(COUNTRY_STORAGE_KEY),
    );
    if (savedCountry) {
      setCountryCode(savedCountry);
      window.localStorage.setItem(COUNTRY_STORAGE_KEY, savedCountry);
    }
    const sync = () => setItems(readCart());
    window.addEventListener("maie-cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("maie-cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(COUNTRY_STORAGE_KEY, countryCode);
  }, [countryCode]);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const baseCurrency = useMemo(() => cartBaseCurrency(items), [items]);
  const total = subtotal + shippingFee;
  const subtotalDisplay = toDisplayMoney(subtotal, baseCurrency);
  const shippingDisplay = toDisplayMoney(shippingFee, baseCurrency);
  const totalDisplay = toDisplayMoney(total, baseCurrency);

  useEffect(() => {
    if (subtotal <= 0) {
      setShippingFee(0);
      return;
    }
    quoteShipping(subtotal, countryCode, baseCurrency)
      .then((quote) => setShippingFee(quote.shippingFee))
      .catch(() => setShippingFee(0));
  }, [baseCurrency, countryCode, subtotal]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0) {
      setError(isArabic ? "السلة فارغة." : "Cart is empty.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const normalizedPhoneCode = phoneCountryCode.trim().startsWith("+")
        ? phoneCountryCode.trim()
        : `+${phoneCountryCode.trim().replace(/\D/g, "")}`;
      const customerName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
      const shippingAddress = [
        addressLine1.trim(),
        addressLine2.trim(),
        [city.trim(), region.trim(), postalCode.trim()].filter(Boolean).join(", "),
      ]
        .filter(Boolean)
        .join("\n");

      const order = await createOrder({
        customerName: customerName || firstName || lastName || "Guest",
        email,
        phone: phone.trim() ? `${normalizedPhoneCode} ${phone.trim()}` : "",
        shippingAddress,
        shippingCountryCode: countryCode,
        notes,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      });

      const payment = await initializeLahzaPayment({
        orderId: order.id,
        returnUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/checkout/failure`,
      });

      clearCart();
      window.location.href = payment.checkoutUrl;
    } catch (submissionError) {
      const message =
        submissionError instanceof Error ? submissionError.message : "Checkout failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
        <p className="text-[11px] tracking-[0.24em] uppercase text-[--muted]">Checkout</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
          Loading checkout...
        </h1>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <p className="text-[11px] tracking-[0.24em] uppercase text-[--muted]">
          {isArabic ? "الدفع" : "Checkout"}
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
          {isArabic ? "السلة فارغة" : "Cart is empty"}
        </h1>
        <p className="mt-4 text-sm text-[--muted]">
          {isArabic
            ? "أضيفي منتجات أولًا ثم عودي لإتمام الدفع."
            : "Add products first, then return to complete checkout."}
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex rounded-full bg-[--ink] px-6 py-3 text-xs tracking-[0.2em] uppercase text-white"
        >
          {isArabic ? "تسوق الآن" : "Shop now"}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-28 sm:px-6 sm:pb-10 lg:px-10">
      <p className="text-[11px] tracking-[0.24em] uppercase text-[--muted]">
        {isArabic ? "الدفع" : "Checkout"}
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
        {isArabic ? "أكملي طلبك" : "Complete your order"}
      </h1>

      <div className="mt-6">
        <button
          type="submit"
          form="checkout-form"
          disabled={loading || items.length === 0}
          className="inline-flex rounded-full bg-[--ink] px-6 py-3 text-xs tracking-[0.2em] uppercase text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? isArabic
              ? "جاري المعالجة..."
              : "Processing..."
            : isArabic
              ? "الدفع عبر لحظة"
              : "Pay with Lahza"}
        </button>
      </div>

      <form
        id="checkout-form"
        onSubmit={onSubmit}
        className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
      >
        <section className="space-y-4 rounded-[1.5rem] border border-[--line] bg-white p-5 sm:p-6">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[--ink]">
              {isArabic ? "بيانات التواصل" : "Contact"}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-[--muted]">
              {isArabic ? "الاسم الأول" : "First name"}
              <input
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
              />
            </label>
            <label className="text-sm text-[--muted]">
              {isArabic ? "اسم العائلة" : "Last name"}
              <input
                required
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
              />
            </label>
            <label className="text-sm text-[--muted]">
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
              />
            </label>
            <label className="text-sm text-[--muted] sm:col-span-2">
              {isArabic ? "الهاتف" : "Phone"}
              <div className="mt-2 grid gap-2 sm:grid-cols-[12rem_1fr]">
                <select
                  required
                  value={phoneCountryCode}
                  onChange={(event) => setPhoneCountryCode(event.target.value)}
                  className="w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
                >
                  {PHONE_CODE_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder={isArabic ? "رقم الهاتف" : "Phone number"}
                  className="w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
                />
              </div>
            </label>
          </div>

          <div className="border-t border-[--line] pt-4">
            <h3 className="font-[family-name:var(--font-display)] text-2xl text-[--ink]">
              {isArabic ? "بيانات التوصيل" : "Delivery"}
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-[--muted]">
              {isArabic ? "البلد / المنطقة" : "Country / Region"}
              <select
                required
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value.toUpperCase())}
                className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
              >
                {checkoutCountryOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name} ({option.code})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-[--muted]">
              {isArabic ? "المدينة" : "City"}
              <input
                required
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
              />
            </label>
            <label className="text-sm text-[--muted]">
              {isArabic ? "المنطقة / المحافظة" : "State / Region"}
              <input
                required
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
              />
            </label>
            <label className="text-sm text-[--muted]">
              {isArabic ? "الرمز البريدي" : "Postal code"}
              <input
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
              />
            </label>
          </div>

          <label className="block text-sm text-[--muted]">
            {isArabic ? "العنوان" : "Address"}
            <input
              required
              value={addressLine1}
              onChange={(event) => setAddressLine1(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
            />
          </label>

          <label className="block text-sm text-[--muted]">
            {isArabic ? "الشقة / الطابق (اختياري)" : "Apartment, suite, etc. (optional)"}
            <input
              value={addressLine2}
              onChange={(event) => setAddressLine2(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
            />
          </label>

          <label className="block text-sm text-[--muted]">
            {isArabic ? "ملاحظات (اختياري)" : "Notes (optional)"}
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-2 min-h-20 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
            />
          </label>

          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="w-full rounded-full bg-[--ink] px-5 py-3 text-xs tracking-[0.2em] uppercase text-white disabled:cursor-not-allowed disabled:opacity-60 lg:hidden"
          >
            {loading
              ? isArabic
                ? "جاري المعالجة..."
                : "Processing..."
              : isArabic
                ? "الدفع عبر لحظة"
                : "Pay with Lahza"}
          </button>
        </section>

        <section className="space-y-4 rounded-[1.5rem] border border-[--line] bg-[--panel] p-5 sm:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[--ink]">
            {isArabic ? "ملخص الطلب" : "Order summary"}
          </h2>
          <div className="space-y-3">
            {items.map((item) => {
              const lineDisplay = toDisplayMoney(
                item.unitPrice * item.quantity,
                item.currency,
              );
              return (
                <div key={item.productId} className="flex items-center justify-between text-sm">
                  <span className="max-w-[70%] text-[--muted]">
                    {item.name} x {item.quantity}
                  </span>
                  <span className="text-[--ink]">
                    {formatMoney(lineDisplay.amount, lineDisplay.currency)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 border-t border-[--line] pt-4 text-sm">
            <div className="flex items-center justify-between text-[--muted]">
              <span>{isArabic ? "المجموع الفرعي" : "Subtotal"}</span>
              <span>{formatMoney(subtotalDisplay.amount, subtotalDisplay.currency)}</span>
            </div>
            <div className="flex items-center justify-between text-[--muted]">
              <span>{isArabic ? "الشحن" : "Shipping"}</span>
              <span>{formatMoney(shippingDisplay.amount, shippingDisplay.currency)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 font-semibold text-[--ink]">
              <span>{isArabic ? "الإجمالي" : "Total"}</span>
              <span>{formatMoney(totalDisplay.amount, totalDisplay.currency)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="w-full rounded-full bg-[--ink] px-5 py-3 text-xs tracking-[0.2em] uppercase text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? isArabic
                ? "جاري المعالجة..."
                : "Processing..."
              : isArabic
                ? "الدفع عبر لحظة"
                : "Pay with Lahza"}
          </button>
        </section>
      </form>

      <div className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl border border-[--line] bg-white/95 p-3 shadow-[0_14px_40px_rgba(0,0,0,0.16)] backdrop-blur sm:left-auto sm:right-6 sm:w-[22rem]">
        <button
          type="submit"
          form="checkout-form"
          disabled={loading || items.length === 0}
          className="w-full rounded-full bg-[--ink] px-5 py-3 text-xs tracking-[0.2em] uppercase text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? isArabic
              ? "جاري المعالجة..."
              : "Processing..."
            : isArabic
              ? "الدفع عبر لحظة"
              : "Pay with Lahza"}
        </button>
      </div>
    </div>
  );
}
