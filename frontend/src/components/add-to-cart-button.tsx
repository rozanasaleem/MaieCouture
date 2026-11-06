"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";
import { Locale, t } from "@/lib/i18n-shared";

type AddToCartButtonProps = {
  productId: number;
  variantId: number | null;
  variantLabel: string | null;
  requireVariant: boolean;
  slug: string;
  name: string;
  image: string | null;
  currency: string;
  unitPrice: number | null;
  purchaseType: "DIRECT_PURCHASE" | "APPOINTMENT_ONLY" | "INQUIRE_ONLY";
  locale: Locale;
  quantity?: number;
};

export function AddToCartButton({
  productId,
  variantId,
  variantLabel,
  requireVariant,
  slug,
  name,
  image,
  currency,
  unitPrice,
  purchaseType,
  locale,
  quantity = 1,
}: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);
  const normalizedPurchaseType = String(purchaseType ?? "")
    .trim()
    .toUpperCase();

  if (normalizedPurchaseType !== "DIRECT_PURCHASE" || unitPrice == null) {
    return null;
  }

  const disabled = requireVariant && variantId == null;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) {
          return;
        }
        addToCart({
          productId,
          variantId,
          variantLabel,
          slug,
          name,
          image,
          currency,
          unitPrice,
          quantity: Math.max(1, quantity),
          purchaseType: "DIRECT_PURCHASE",
        });
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1400);
      }}
      className="mt-3 inline-flex rounded-full border border-[#171513] bg-[#171513] px-6 py-3 text-xs tracking-[0.2em] uppercase text-white transition hover:bg-[#2a2622] disabled:cursor-not-allowed disabled:border-[#8a857e] disabled:bg-[#8a857e] disabled:text-white/90"
    >
      {added
        ? t(locale, { en: "Added", ar: "تمت الإضافة", es: "Anadido" })
        : disabled
          ? t(locale, { en: "Select size/color", ar: "اختاري المقاس/اللون", es: "Selecciona talla/color" })
        : t(locale, { en: "Add to cart", ar: "أضف إلى السلة", es: "Agregar al carrito" })}
    </button>
  );
}
