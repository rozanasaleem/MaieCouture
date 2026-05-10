"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  cartBaseCurrency,
  cartSubtotal,
  readCart,
  removeFromCart,
  updateCartQuantity,
} from "@/lib/cart";
import {
  formatMoney,
  toDisplayMoney,
} from "@/lib/currency-client";
import { getLocaleFromDocument } from "@/lib/i18n-client";

export default function CartPage() {
  const locale = getLocaleFromDocument();
  const isArabic = locale === "ar";
  const [items, setItems] = useState(readCart());

  useEffect(() => {
    const sync = () => setItems(readCart());
    window.addEventListener("maie-cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("maie-cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const baseCurrency = useMemo(() => cartBaseCurrency(items), [items]);
  const subtotalDisplay = toDisplayMoney(subtotal, baseCurrency);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <p className="text-[11px] tracking-[0.24em] uppercase text-[--muted]">
          {isArabic ? "السلة" : "Cart"}
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
          {isArabic ? "سلتك فارغة" : "Your cart is empty"}
        </h1>
        <p className="mt-4 text-sm text-[--muted]">
          {isArabic
            ? "ابدئي باستكشاف التصاميم وإضافة القطع المناسبة لك."
            : "Start exploring the collections and add pieces you love."}
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
      <p className="text-[11px] tracking-[0.24em] uppercase text-[--muted]">
        {isArabic ? "السلة" : "Cart"}
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
        {isArabic ? "راجعي طلبك" : "Review your order"}
      </h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4">
          {items.map((item) => {
            const unitDisplay = toDisplayMoney(item.unitPrice, item.currency);
            const lineDisplay = toDisplayMoney(
              item.unitPrice * item.quantity,
              item.currency,
            );

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
                    {isArabic ? "حذف" : "Remove"}
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <label className="text-sm text-[--muted]">
                    {isArabic ? "الكمية" : "Quantity"}
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
            {isArabic ? "الملخص" : "Summary"}
          </h2>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between text-[--muted]">
              <span>{isArabic ? "المجموع الفرعي" : "Subtotal"}</span>
              <span>{formatMoney(subtotalDisplay.amount, subtotalDisplay.currency)}</span>
            </div>
            <div className="flex items-center justify-between text-[--muted]">
              <span>{isArabic ? "الشحن" : "Shipping"}</span>
              <span>{isArabic ? "يُحسب عند الدفع" : "Calculated at checkout"}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="mt-6 inline-flex w-full justify-center rounded-full bg-[--ink] px-5 py-3 text-xs tracking-[0.2em] uppercase text-white"
          >
            {isArabic ? "المتابعة إلى الدفع" : "Continue to checkout"}
          </Link>
        </aside>
      </div>
    </div>
  );
}
