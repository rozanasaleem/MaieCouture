"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePreferredCountry, usePreferredCurrency } from "@/components/store-preferences";
import { setPreferredCountry } from "@/lib/country-client";
import {
  createOrder,
  initializeCyberSourcePayment,
  initializeLahzaPayment,
  quoteShipping,
} from "@/lib/api";
import { clearCart, readCart } from "@/lib/cart";
import {
  formatMoney,
  sumMoneyInCurrency,
  toDisplayMoney,
} from "@/lib/currency-client";
import { getLocaleFromDocument } from "@/lib/i18n-client";
import { Locale, t } from "@/lib/i18n-shared";
import { SHIPPING_COUNTRY_CODES } from "@/lib/shipping-countries";

const PAYMENT_PROVIDER = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? "cybersource";

type CheckoutCountryOption = {
  code: string;
  name: string;
};

type PhoneCodeOption = {
  code: string;
  label: string;
};

type PalestineShippingAreaOption = {
  code: "WEST_BANK" | "JERUSALEM" | "AREAS_48";
  labels: Record<Locale, string>;
};

type PalestineCityOption = {
  value: string;
  labels: Record<Locale, string>;
  areaCode: PalestineShippingAreaOption["code"];
};

const fallbackCountryOptionsByLocale: Record<Locale, CheckoutCountryOption[]> = {
  en: [
    { code: "PS", name: "Palestine" },
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "AE", name: "United Arab Emirates" },
  ],
  ar: [
    { code: "PS", name: "فلسطين" },
    { code: "US", name: "الولايات المتحدة" },
    { code: "GB", name: "المملكة المتحدة" },
    { code: "AE", name: "الإمارات العربية المتحدة" },
  ],
  es: [
    { code: "PS", name: "Palestina" },
    { code: "US", name: "Estados Unidos" },
    { code: "GB", name: "Reino Unido" },
    { code: "AE", name: "Emiratos Arabes Unidos" },
  ],
};

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

const PALESTINE_CITY_OPTIONS: PalestineCityOption[] = [
  { value: "Ramallah", labels: { en: "Ramallah", ar: "رام الله", es: "Ramala" }, areaCode: "WEST_BANK" },
  { value: "Al-Bireh", labels: { en: "Al-Bireh", ar: "البيرة", es: "Al Bireh" }, areaCode: "WEST_BANK" },
  { value: "Rawabi", labels: { en: "Rawabi", ar: "روابي", es: "Rawabi" }, areaCode: "WEST_BANK" },
  { value: "Birzeit", labels: { en: "Birzeit", ar: "بيرزيت", es: "Birzeit" }, areaCode: "WEST_BANK" },
  { value: "Bethlehem", labels: { en: "Bethlehem", ar: "بيت لحم", es: "Belen" }, areaCode: "WEST_BANK" },
  { value: "Beit Jala", labels: { en: "Beit Jala", ar: "بيت جالا", es: "Beit Jala" }, areaCode: "WEST_BANK" },
  { value: "Beit Sahour", labels: { en: "Beit Sahour", ar: "بيت ساحور", es: "Beit Sahour" }, areaCode: "WEST_BANK" },
  { value: "Hebron", labels: { en: "Hebron", ar: "الخليل", es: "Hebron" }, areaCode: "WEST_BANK" },
  { value: "Nablus", labels: { en: "Nablus", ar: "نابلس", es: "Nablus" }, areaCode: "WEST_BANK" },
  { value: "Jenin", labels: { en: "Jenin", ar: "جنين", es: "Jenin" }, areaCode: "WEST_BANK" },
  { value: "Tulkarem", labels: { en: "Tulkarem", ar: "طولكرم", es: "Tulkarem" }, areaCode: "WEST_BANK" },
  { value: "Qalqilya", labels: { en: "Qalqilya", ar: "قلقيلية", es: "Qalqilya" }, areaCode: "WEST_BANK" },
  { value: "Jericho", labels: { en: "Jericho", ar: "أريحا", es: "Jerico" }, areaCode: "WEST_BANK" },
  { value: "Salfit", labels: { en: "Salfit", ar: "سلفيت", es: "Salfit" }, areaCode: "WEST_BANK" },
  { value: "Tubas", labels: { en: "Tubas", ar: "طوباس", es: "Tubas" }, areaCode: "WEST_BANK" },
  { value: "Jerusalem", labels: { en: "Jerusalem", ar: "القدس", es: "Jerusalen" }, areaCode: "JERUSALEM" },
  { value: "Haifa", labels: { en: "Haifa", ar: "حيفا", es: "Haifa" }, areaCode: "AREAS_48" },
  { value: "Jaffa", labels: { en: "Jaffa", ar: "يافا", es: "Jaffa" }, areaCode: "AREAS_48" },
  { value: "Nazareth", labels: { en: "Nazareth", ar: "الناصرة", es: "Nazaret" }, areaCode: "AREAS_48" },
  { value: "Acre", labels: { en: "Acre", ar: "عكا", es: "Acre" }, areaCode: "AREAS_48" },
  { value: "Umm al-Fahm", labels: { en: "Umm al-Fahm", ar: "أم الفحم", es: "Umm al-Fahm" }, areaCode: "AREAS_48" },
  { value: "Sakhnin", labels: { en: "Sakhnin", ar: "سخنين", es: "Sakhnin" }, areaCode: "AREAS_48" },
  { value: "Shefa-Amr", labels: { en: "Shefa-Amr", ar: "شفاعمرو", es: "Shefa-Amr" }, areaCode: "AREAS_48" },
  { value: "Arraba", labels: { en: "Arraba", ar: "عرابة", es: "Arraba" }, areaCode: "AREAS_48" },
  { value: "Tamra", labels: { en: "Tamra", ar: "طمرة", es: "Tamra" }, areaCode: "AREAS_48" },
  { value: "Tayibe", labels: { en: "Tayibe", ar: "الطيبة", es: "Tayibe" }, areaCode: "AREAS_48" },
  { value: "Tira", labels: { en: "Tira", ar: "الطيرة", es: "Tira" }, areaCode: "AREAS_48" },
  { value: "Rahat", labels: { en: "Rahat", ar: "رهط", es: "Rahat" }, areaCode: "AREAS_48" },
  { value: "Lod", labels: { en: "Lod", ar: "اللد", es: "Lod" }, areaCode: "AREAS_48" },
  { value: "Ramle", labels: { en: "Ramle", ar: "الرملة", es: "Ramle" }, areaCode: "AREAS_48" },
  { value: "Kafr Qasim", labels: { en: "Kafr Qasim", ar: "كفر قاسم", es: "Kafr Qasim" }, areaCode: "AREAS_48" },
  { value: "Kafr Kanna", labels: { en: "Kafr Kanna", ar: "كفر كنا", es: "Kafr Kanna" }, areaCode: "AREAS_48" },
];

function palestineCityLabel(city: PalestineCityOption, locale: Locale) {
  return city.labels[locale] ?? city.labels.en;
}

function buildCheckoutCountryOptions(locale: Locale): CheckoutCountryOption[] {
  if (typeof Intl === "undefined" || typeof Intl.DisplayNames !== "function") {
    return fallbackCountryOptionsByLocale[locale];
  }

  const names = new Intl.DisplayNames([locale === "ar" ? "ar" : locale === "es" ? "es" : "en"], {
    type: "region",
  });

  const options = SHIPPING_COUNTRY_CODES
    .map((code) => ({
      code,
      name: names.of(code) ?? code,
    }))
    .filter((option) => option.code !== "IL")
    .filter((option) => option.name !== option.code)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!options.some((option) => option.code === "PS")) {
    options.push(
      locale === "ar"
        ? { code: "PS", name: "فلسطين" }
        : locale === "es"
          ? { code: "PS", name: "Palestina" }
          : { code: "PS", name: "Palestine" },
    );
    options.sort((a, b) => a.name.localeCompare(b.name));
  }

  return options.length > 0 ? options : fallbackCountryOptionsByLocale[locale];
}

export default function CheckoutPage() {
  const [mounted, setMounted] = useState(false);
  const locale = mounted ? getLocaleFromDocument() : "en";

  const [items, setItems] = useState<ReturnType<typeof readCart>>([]);
  const preferredCurrency = usePreferredCurrency();
  const preferredCountry = usePreferredCountry();
  const shippingCountryEdited = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingQuote, setShippingQuote] = useState<{ key: string; fee: number | null } | null>(null);
  const [shippingRetry, setShippingRetry] = useState(0);
  const [countryCode, setCountryCode] = useState(preferredCountry);
  const [shippingAreaCode, setShippingAreaCode] = useState<PalestineShippingAreaOption["code"]>("WEST_BANK");
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
  const [billingSameAsDelivery, setBillingSameAsDelivery] = useState(true);
  const [billing, setBilling] = useState({
    firstName: "", lastName: "", address1: "", address2: "", locality: "",
    administrativeArea: "", postalCode: "", country: "PS", phoneNumber: "",
  });
  const [notes, setNotes] = useState("");
  const checkoutCountryOptions = useMemo(() => buildCheckoutCountryOptions(locale), [locale]);
  const selectedPalestineCity = useMemo(
    () => PALESTINE_CITY_OPTIONS.find((option) => option.value === city) ?? null,
    [city],
  );
  const effectiveShippingAreaCode = selectedPalestineCity?.areaCode ?? shippingAreaCode;
  const destinationAreaCode = countryCode === "PS" ? effectiveShippingAreaCode : region.trim();
  const shippingSummaryLocation = countryCode === "PS"
    ? selectedPalestineCity
      ? palestineCityLabel(selectedPalestineCity, locale)
      : t(locale, { en: "select city", ar: "اختر المدينة", es: "selecciona ciudad" })
    : "";
  const paymentButtonLabel = PAYMENT_PROVIDER === "cybersource"
    ? t(locale, { en: "Continue to secure payment", ar: "المتابعة للدفع الآمن", es: "Continuar al pago seguro" })
    : t(locale, { en: "Pay with Lahza", ar: "الدفع عبر لحظة", es: "Pagar con Lahza" });

  useEffect(() => {
    setMounted(true);
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener("maie-cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("maie-cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!shippingCountryEdited.current) setCountryCode(preferredCountry);
  }, [preferredCountry]);

  useEffect(() => {
    if (countryCode === "PS" && city && !PALESTINE_CITY_OPTIONS.some((option) => option.value === city)) {
      setCity("");
    }
  }, [city, countryCode]);

  const subtotalDisplay = useMemo(
    () =>
      sumMoneyInCurrency(
        items.map((item) => ({
          amount: item.unitPrice,
          currency: item.currency,
          quantity: item.quantity,
        })),
        preferredCurrency,
      ),
    [items, preferredCurrency],
  );
  const shippingDisplay = useMemo(
    () => ({
      amount: Number((shippingQuote?.fee ?? 0).toFixed(2)),
      currency: subtotalDisplay.currency,
      estimated: false,
    }),
    [shippingQuote, subtotalDisplay.currency],
  );
  const shippingQuoteItems = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    [items],
  );
  const totalDisplay = useMemo(
    () => ({
      amount: Number((subtotalDisplay.amount + shippingDisplay.amount).toFixed(2)),
      currency: subtotalDisplay.currency,
      estimated: subtotalDisplay.estimated,
    }),
    [shippingDisplay.amount, subtotalDisplay.amount, subtotalDisplay.currency, subtotalDisplay.estimated],
  );

  const shippingKey = items.length === 0 || (countryCode === "PS" && !selectedPalestineCity)
    ? null
    : JSON.stringify([countryCode, destinationAreaCode, subtotalDisplay.amount, subtotalDisplay.currency, shippingQuoteItems, shippingRetry]);
  const currentShippingQuote = shippingQuote?.key === shippingKey ? shippingQuote : null;
  const shippingReady = currentShippingQuote != null && currentShippingQuote.fee != null;
  const shippingFailed = currentShippingQuote != null && currentShippingQuote.fee == null;
  const paymentDisabled = loading || !shippingReady;

  useEffect(() => {
    if (!shippingKey) return;
    let cancelled = false;
    quoteShipping(
      subtotalDisplay.amount,
      countryCode,
      subtotalDisplay.currency,
      destinationAreaCode,
      shippingQuoteItems,
    )
      .then((quote) => {
        if (!cancelled) setShippingQuote({ key: shippingKey, fee: Number.isFinite(quote.shippingFee) && quote.shippingFee >= 0 ? quote.shippingFee : null });
      })
      .catch((quoteError) => {
        console.error("Shipping quote failed", quoteError);
        if (!cancelled) setShippingQuote({ key: shippingKey, fee: null });
      });
    return () => { cancelled = true; };
  }, [
    countryCode,
    effectiveShippingAreaCode,
    destinationAreaCode,
    selectedPalestineCity,
    shippingQuoteItems,
    subtotalDisplay.amount,
    subtotalDisplay.currency,
    shippingKey,
  ]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shippingReady) {
      setError(t(locale, { en: "Please wait for a shipping quote before continuing.", ar: "يرجى انتظار حساب تكلفة الشحن قبل المتابعة.", es: "Espera el calculo del envio antes de continuar." }));
      return;
    }
    if (items.length === 0) {
      setError(t(locale, { en: "Cart is empty.", ar: "السلة فارغة.", es: "El carrito esta vacio." }));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const normalizedPhoneCode = phoneCountryCode.trim().startsWith("+")
        ? phoneCountryCode.trim()
        : `+${phoneCountryCode.trim().replace(/\D/g, "")}`;
      const customerName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
      if (countryCode === "PS" && !selectedPalestineCity) {
        setError(t(locale, { en: "Please select your city.", ar: "يرجى اختيار المدينة.", es: "Selecciona tu ciudad." }));
        setLoading(false);
        return;
      }
      const cityLine = countryCode === "PS" && selectedPalestineCity
        ? palestineCityLabel(selectedPalestineCity, locale)
        : city.trim();
      const shippingAddress = [
        addressLine1.trim(),
        addressLine2.trim(),
        [cityLine, region.trim(), postalCode.trim()].filter(Boolean).join(", "),
      ]
        .filter(Boolean)
        .join("\n");

      const order = await createOrder({
        customerName: customerName || firstName || lastName || "Guest",
        email,
        phone: phone.trim() ? `${normalizedPhoneCode} ${phone.trim()}` : "",
        shippingAddress,
        shippingCountryCode: countryCode,
        shippingAreaCode: destinationAreaCode,
        currency: preferredCurrency,
        notes,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      });

      if (PAYMENT_PROVIDER === "cybersource") {
        const billTo = billingSameAsDelivery ? {
          firstName: firstName.trim(), lastName: lastName.trim(),
          address1: addressLine1.trim(), address2: addressLine2.trim(),
          locality: cityLine, administrativeArea: region.trim(),
          postalCode: postalCode.trim(), country: countryCode,
          phoneNumber: `${normalizedPhoneCode}${phone.replace(/\D/g, "")}`,
        } : Object.fromEntries(Object.entries(billing).map(([key, value]) => [key, value.trim()])) as typeof billing;
        const payment = await initializeCyberSourcePayment({ orderId: order.id, billTo });
        if (!payment.captureContext || !payment.clientLibrary || !payment.clientLibraryIntegrity || payment.mock) {
          throw new Error(
            "CyberSource is not fully enabled yet. Add the sandbox merchant credentials before taking live payments.",
          );
        }
        window.sessionStorage.setItem("maie_cybersource_capture_context", payment.captureContext);
        window.sessionStorage.setItem("maie_cybersource_reference", payment.reference);
        window.sessionStorage.setItem("maie_cybersource_client_library_integrity", payment.clientLibraryIntegrity);
        if (payment.clientLibrary) {
          window.sessionStorage.setItem("maie_cybersource_client_library", payment.clientLibrary);
        } else {
          window.sessionStorage.removeItem("maie_cybersource_client_library");
        }
        window.location.href = `/checkout/cybersource?reference=${encodeURIComponent(payment.reference)}`;
        return;
      }

      const payment = await initializeLahzaPayment({
        orderId: order.id,
        returnUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/checkout/failure`,
      });

      clearCart();
      window.location.href = payment.checkoutUrl;
    } catch (submissionError) {
      const rawMessage =
        submissionError instanceof Error ? submissionError.message : "Checkout failed.";
      const message = rawMessage.toLowerCase().includes("payment provider")
        || rawMessage.toLowerCase().includes("cybersource")
        ? t(locale, {
            en: "Payment could not be started. Please try again or contact the atelier.",
            ar: "تعذر بدء عملية الدفع. يرجى المحاولة مرة أخرى أو التواصل مع الأتيليه.",
            es: "No se pudo iniciar el pago. Intentalo de nuevo o contacta al atelier.",
          })
        : rawMessage;
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
        <p className="text-[11px] tracking-[0.24em] uppercase text-[--muted]">
          {t(locale, { en: "Checkout", ar: "الدفع", es: "Pago" })}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
          {t(locale, { en: "Loading checkout...", ar: "جاري تحميل صفحة الدفع...", es: "Cargando pago..." })}
        </h1>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <p className="text-[11px] tracking-[0.24em] uppercase text-[--muted]">
          {t(locale, { en: "Checkout", ar: "الدفع", es: "Pago" })}
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
          {t(locale, { en: "Cart is empty", ar: "السلة فارغة", es: "El carrito esta vacio" })}
        </h1>
        <p className="mt-4 text-sm text-[--muted]">
          {t(locale, {
            en: "Add products first, then return to complete checkout.",
            ar: "أضيفي منتجات أولًا ثم عودي لإتمام الدفع.",
            es: "Agrega productos primero y luego vuelve para completar el pago.",
          })}
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex rounded-full bg-[--ink] px-6 py-3 text-xs tracking-[0.2em] uppercase text-white"
        >
          {t(locale, { en: "Shop now", ar: "تسوق الآن", es: "Comprar ahora" })}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-28 sm:px-6 sm:pb-10 lg:px-10">
      <p className="text-[11px] tracking-[0.24em] uppercase text-[--muted]">
        {t(locale, { en: "Checkout", ar: "الدفع", es: "Pago" })}
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
        {t(locale, { en: "Complete your order", ar: "أكملي طلبك", es: "Completa tu pedido" })}
      </h1>

      <div className="mt-6">
        <button
          type="submit"
          form="checkout-form"
          disabled={loading || items.length === 0}
          className="inline-flex rounded-full bg-black px-6 py-3 text-xs tracking-[0.2em] uppercase text-white shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-white"
        >
          {loading
            ? t(locale, { en: "Processing...", ar: "جاري المعالجة...", es: "Procesando..." })
            : paymentButtonLabel}
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
              {t(locale, { en: "Contact", ar: "بيانات التواصل", es: "Contacto" })}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-[--muted]">
              {t(locale, { en: "First name", ar: "الاسم الأول", es: "Nombre" })}
              <input
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
              />
            </label>
            <label className="text-sm text-[--muted]">
              {t(locale, { en: "Last name", ar: "اسم العائلة", es: "Apellido" })}
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
              {t(locale, { en: "Phone", ar: "الهاتف", es: "Telefono" })}
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
                  placeholder={t(locale, { en: "Phone number", ar: "رقم الهاتف", es: "Numero de telefono" })}
                  className="w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
                />
              </div>
            </label>
          </div>

          <div className="border-t border-[--line] pt-4">
            <h3 className="font-[family-name:var(--font-display)] text-2xl text-[--ink]">
              {t(locale, { en: "Delivery", ar: "بيانات التوصيل", es: "Entrega" })}
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-[--muted]">
              {t(locale, { en: "Country / Region", ar: "البلد / المنطقة", es: "Pais / Region" })}
              <select
                required
                value={countryCode}
                onChange={(event) => {
                  const nextCountryCode = event.target.value.toUpperCase();
                  shippingCountryEdited.current = true;
                  setCountryCode(nextCountryCode);
                  setPreferredCountry(nextCountryCode);
                  if (nextCountryCode === "PS") {
                    setCity("");
                  }
                }}
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
              {t(locale, { en: "City", ar: "المدينة", es: "Ciudad" })}
              {countryCode === "PS" ? (
                <select
                  required
                  value={city}
                  onChange={(event) => {
                    const nextCity = event.target.value;
                    setCity(nextCity);
                    const cityOption = PALESTINE_CITY_OPTIONS.find((option) => option.value === nextCity);
                    if (cityOption) {
                      setShippingAreaCode(cityOption.areaCode);
                    }
                  }}
                  className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
                >
                  <option value="">
                    {t(locale, { en: "Select city", ar: "اختر المدينة", es: "Selecciona ciudad" })}
                  </option>
                  {PALESTINE_CITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {palestineCityLabel(option, locale)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
                />
              )}
            </label>
            <label className="text-sm text-[--muted]">
              {t(locale, { en: "State / Region", ar: "المنطقة / المحافظة", es: "Provincia / Region" })}
              <input
                required
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
              />
            </label>
            <label className="text-sm text-[--muted]">
              {t(locale, { en: "Postal code", ar: "الرمز البريدي", es: "Codigo postal" })}
              <input
                required={PAYMENT_PROVIDER === "cybersource" && billingSameAsDelivery && ["US", "CA", "GB"].includes(countryCode)}
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
              />
            </label>
          </div>

          <label className="block text-sm text-[--muted]">
            {t(locale, { en: "Address", ar: "العنوان", es: "Direccion" })}
            <input
              required
              value={addressLine1}
              onChange={(event) => setAddressLine1(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
            />
          </label>

          <label className="block text-sm text-[--muted]">
            {t(locale, { en: "Apartment, suite, etc. (optional)", ar: "الشقة / الطابق (اختياري)", es: "Apartamento, suite, etc. (opcional)" })}
            <input
              value={addressLine2}
              onChange={(event) => setAddressLine2(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
            />
          </label>

          {PAYMENT_PROVIDER === "cybersource" && (
            <fieldset className="space-y-4 border-t border-[--line] pt-4">
              <legend className="font-[family-name:var(--font-display)] text-2xl text-[--ink]">
                {t(locale, { en: "Billing address", ar: "عنوان الفاتورة", es: "Direccion de facturacion" })}
              </legend>
              <label className="flex items-center gap-2 text-sm text-[--ink]">
                <input type="checkbox" checked={billingSameAsDelivery}
                  onChange={(event) => setBillingSameAsDelivery(event.target.checked)} />
                {t(locale, { en: "Billing details are the same as delivery details", ar: "بيانات الفاتورة مطابقة لبيانات التوصيل", es: "Los datos de facturacion son los mismos que los de entrega" })}
              </label>
              {!billingSameAsDelivery && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {([
                    ["firstName", { en: "First name", ar: "الاسم الأول", es: "Nombre" }],
                    ["lastName", { en: "Last name", ar: "اسم العائلة", es: "Apellido" }],
                    ["address1", { en: "Address", ar: "العنوان", es: "Direccion" }],
                    ["address2", { en: "Apartment, suite (optional)", ar: "الشقة (اختياري)", es: "Apartamento (opcional)" }],
                    ["locality", { en: "City", ar: "المدينة", es: "Ciudad" }],
                    ["administrativeArea", { en: "State / Region", ar: "المنطقة / المحافظة", es: "Provincia / Region" }],
                    ["postalCode", { en: "Postal code", ar: "الرمز البريدي", es: "Codigo postal" }],
                    ["phoneNumber", { en: "Phone including country code", ar: "الهاتف مع رمز الدولة", es: "Telefono con codigo de pais" }],
                  ] as const).map(([field, label]) => (
                    <label key={field} className="text-sm text-[--muted]">
                      {t(locale, label)}
                      <input value={billing[field]}
                        required={field !== "address2" && (field !== "postalCode" || ["US", "CA", "GB"].includes(billing.country))}
                        maxLength={field === "postalCode" ? 10 : field === "phoneNumber" ? 20 : field === "locality" || field === "administrativeArea" ? 50 : 60}
                        autoComplete={`billing ${field === "firstName" ? "given-name" : field === "lastName" ? "family-name" : field === "address1" ? "address-line1" : field === "address2" ? "address-line2" : field === "locality" ? "address-level2" : field === "administrativeArea" ? "address-level1" : field === "postalCode" ? "postal-code" : "tel"}`}
                        onChange={(event) => setBilling((current) => ({ ...current, [field]: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]" />
                    </label>
                  ))}
                  <label className="text-sm text-[--muted]">
                    {t(locale, { en: "Country / Region", ar: "البلد / المنطقة", es: "Pais / Region" })}
                    <select required value={billing.country} autoComplete="billing country"
                      onChange={(event) => setBilling((current) => ({ ...current, country: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]">
                      {checkoutCountryOptions.map((option) => <option key={option.code} value={option.code}>{option.name} ({option.code})</option>)}
                    </select>
                  </label>
                </div>
              )}
            </fieldset>
          )}

          <label className="block text-sm text-[--muted]">
            {t(locale, { en: "Notes (optional)", ar: "ملاحظات (اختياري)", es: "Notas (opcional)" })}
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-2 min-h-20 w-full rounded-xl border border-[--line] px-3 py-3 text-[--ink] outline-none focus:border-[--ink]"
            />
          </label>

          <button
            type="submit"
            disabled={paymentDisabled}
            className="w-full rounded-full bg-black px-5 py-3 text-xs tracking-[0.2em] uppercase text-white shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-white lg:hidden"
          >
            {loading
              ? t(locale, { en: "Processing...", ar: "جاري المعالجة...", es: "Procesando..." })
              : paymentButtonLabel}
          </button>
        </section>

        <section className="space-y-4 rounded-[1.5rem] border border-[--line] bg-[--panel] p-5 sm:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[--ink]">
            {t(locale, { en: "Order summary", ar: "ملخص الطلب", es: "Resumen del pedido" })}
          </h2>
          <div className="space-y-3">
            {items.map((item) => {
              const unitDisplay = toDisplayMoney(item.unitPrice, item.currency, preferredCurrency);
              const lineDisplay = { ...unitDisplay, amount: unitDisplay.amount * item.quantity };
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
              <span>{t(locale, { en: "Subtotal", ar: "المجموع الفرعي", es: "Subtotal" })}</span>
              <span>{formatMoney(subtotalDisplay.amount, subtotalDisplay.currency)}</span>
            </div>
            <div className="flex items-center justify-between text-[--muted]">
              <span>
                {t(locale, { en: "Shipping", ar: "الشحن", es: "Envio" })}
                {countryCode === "PS" ? ` (${shippingSummaryLocation})` : ""}
              </span>
              <span>{shippingReady
                ? formatMoney(shippingDisplay.amount, shippingDisplay.currency)
                : shippingKey == null
                  ? t(locale, { en: "Select city", ar: "اختر المدينة", es: "Selecciona ciudad" })
                  : shippingFailed
                    ? t(locale, { en: "Unavailable", ar: "غير متاح", es: "No disponible" })
                    : t(locale, { en: "Calculating...", ar: "جار الحساب...", es: "Calculando..." })}</span>
            </div>
            <div className="flex items-center justify-between pt-2 font-semibold text-[--ink]">
              <span>{t(locale, { en: "Total", ar: "الإجمالي", es: "Total" })}</span>
              <span>{shippingReady ? formatMoney(totalDisplay.amount, totalDisplay.currency) : "--"}</span>
            </div>
          </div>

          {shippingFailed && (
            <p role="alert" className="text-sm text-red-600">
              {t(locale, { en: "Shipping could not be calculated.", ar: "تعذر حساب تكلفة الشحن.", es: "No se pudo calcular el envio." })}{" "}
              <button type="button" className="underline" onClick={() => setShippingRetry((value) => value + 1)}>
                {t(locale, { en: "Retry", ar: "حاول مجددا", es: "Reintentar" })}
              </button>
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={paymentDisabled}
            className="w-full rounded-full bg-black px-5 py-3 text-xs tracking-[0.2em] uppercase text-white shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-white"
          >
            {loading
              ? t(locale, { en: "Processing...", ar: "جاري المعالجة...", es: "Procesando..." })
              : paymentButtonLabel}
          </button>
        </section>
      </form>

      <div className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl border border-[--line] bg-white/95 p-3 shadow-[0_14px_40px_rgba(0,0,0,0.16)] backdrop-blur lg:hidden">
        <button
          type="submit"
          form="checkout-form"
          disabled={paymentDisabled}
          className="w-full rounded-full bg-black px-5 py-3 text-xs tracking-[0.2em] uppercase text-white shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-white"
        >
          {loading
            ? t(locale, { en: "Processing...", ar: "جاري المعالجة...", es: "Procesando..." })
            : paymentButtonLabel}
        </button>
      </div>
    </div>
  );
}
