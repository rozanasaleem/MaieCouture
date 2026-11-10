"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePreferredCurrency } from "@/components/store-preferences";
import {
  cartBaseCurrency,
  cartSubtotal,
  readCart,
  removeFromCart,
  updateCartQuantity,
} from "@/lib/cart";
import {
  formatMoney,
  sumMoneyInCurrency,
  toDisplayMoney,
} from "@/lib/currency-client";
import { getLocaleFromDocument } from "@/lib/i18n-client";
import { t } from "@/lib/i18n-shared";

export default function CartPage() {
  const locale = getLocaleFromDocument();
  const [items, setItems] = useState<ReturnType<typeof readCart>>([]);
  const preferredCurrency = usePreferredCurrency();

  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener("maie-cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("maie-cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
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

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <p className="text-[11px] tracking-[0.24em] uppercase text-[--muted]">
          {t(locale, { en: "Cart", ar: "السلة", es: "Carrito" })}
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
          {t(locale, { en: "Your cart is empty", ar: "سلتك فارغة", es: "Tu carrito esta vacio" })}
        </h1>
        <p className="mt-4 text-sm text-[--muted]">
          {t(locale, {
            en: "Start exploring the collections and add pieces you love.",
            ar: "ابدئي باستكشاف التصاميم وإضافة القطع المناسبة لك.",
            es: "Empieza a descubrir las colecciones y agrega las piezas que te encantan.",
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
      <p className="text-[11px] tracking-[0.24em] uppercase text-[--muted]">
        {t(locale, { en: "Cart", ar: "السلة", es: "Carrito" })}
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
        {t(locale, { en: "Review your order", ar: "راجعي طلبك", es: "Revisa tu pedido" })}
      </h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4">
          {items.map((item) => {
            const unitDisplay = toDisplayMoney(item.unitPrice, item.currency, preferredCurrency);
            const lineDisplay = { ...unitDisplay, amount: unitDisplay.amount * item.quantity };

            return (
              <div
                key={`${item.productId}-${item.variantId ?? "no-variant"}`}
                className="rounded-[1.5rem] border border-[--line] bg-white p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-2xl text-[--ink]">
                      {item.name}
                    </h2>
                    <p className="mt-1 text-sm text-[--muted]">
                      {formatMoney(unitDisplay.amount, unitDisplay.currency)}
                    </p>
                    {item.variantLabel && (
                      <p className="mt-1 text-xs tracking-[0.14em] uppercase text-[--muted]">
                        {item.variantLabel}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.productId, item.variantId)}
                    className="text-xs tracking-[0.14em] uppercase text-[--muted] underline underline-offset-4"
                  >
                    {t(locale, { en: "Remove", ar: "حذف", es: "Eliminar" })}
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <label className="text-sm text-[--muted]">
                    {t(locale, { en: "Quantity", ar: "الكمية", es: "Cantidad" })}
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) =>
                        updateCartQuantity(
                          item.productId,
                          item.variantId,
                          Number(event.target.value || 1),
                        )
                      }
                      className="ml-3 w-20 rounded-lg border border-[--line] px-3 py-2 text-[--ink] outline-none focus:border-[--ink]"
                    />
                  </label>
                  <p className="font-medium text-[--ink]">
                    {formatMoney(lineDisplay.amount, lineDisplay.currency)}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        <aside className="h-fit rounded-[1.5rem] border border-[--line] bg-[--panel] p-5 sm:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[--ink]">
            {t(locale, { en: "Summary", ar: "الملخص", es: "Resumen" })}
          </h2>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between text-[--muted]">
              <span>{t(locale, { en: "Subtotal", ar: "المجموع الفرعي", es: "Subtotal" })}</span>
              <span>{formatMoney(subtotalDisplay.amount, subtotalDisplay.currency)}</span>
            </div>
            <div className="flex items-center justify-between text-[--muted]">
              <span>{t(locale, { en: "Shipping", ar: "الشحن", es: "Envio" })}</span>
              <span>{t(locale, { en: "Calculated at checkout", ar: "يُحسب عند الدفع", es: "Se calcula al finalizar la compra" })}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="mt-6 inline-flex w-full justify-center rounded-full bg-[--ink] px-5 py-3 text-xs tracking-[0.2em] uppercase text-white"
          >
            {t(locale, { en: "Continue to checkout", ar: "المتابعة إلى الدفع", es: "Continuar al pago" })}
          </Link>
        </aside>
      </div>
    </div>
  );
}
