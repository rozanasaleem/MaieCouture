"use client";

import { useEffect, useMemo } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Locale, t } from "@/lib/i18n-shared";
import { ProductDetail } from "@/lib/types";

type ProductPurchaseControlsProps = {
  product: ProductDetail;
  locale: Locale;
  selectedSize: string;
  selectedColor: string;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
  onVariantChange: (variantId: number | null, variantLabel: string | null) => void;
};

const STANDARD_SIZE_RANGE = ["XS", "S", "M", "L", "XL"];
const STYLE_HINTS = [
  "dress",
  "vest",
  "cape",
  "look",
  "set",
  "top",
  "skirt",
  "jacket",
  "blazer",
  "only",
  "with",
  "long",
  "short",
];

function unique(values: Array<string | null>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isLikelyColorValue(value: string) {
  const normalized = normalizeToken(value);
  if (!normalized) {
    return false;
  }

  if (STYLE_HINTS.some((hint) => normalized.includes(hint))) {
    return false;
  }

  const knownColorTokens = [
    "black",
    "white",
    "ivory",
    "cream",
    "beige",
    "camel",
    "taupe",
    "nude",
    "gold",
    "silver",
    "blue",
    "navy",
    "azure",
    "royal",
    "green",
    "olive",
    "sage",
    "khaki",
    "red",
    "burgundy",
    "maroon",
    "pomegranate",
    "pink",
    "rose",
    "purple",
    "lilac",
    "orange",
    "yellow",
    "brown",
    "grey",
    "gray",
  ];

  return knownColorTokens.some((token) => normalized.includes(token));
}

function isVariantPurchasable(
  variant: ProductDetail["variants"][number],
  productStatus: ProductDetail["productStatus"],
) {
  if (variant.madeToOrder) {
    return true;
  }
  if (productStatus === "SOLD_OUT" || productStatus === "ARCHIVED") {
    return false;
  }
  if (productStatus === "LIMITED") {
    return variant.stockQuantity > 0;
  }
  // For NEW/EVERGREEN products, we default to purchasable unless explicitly sold out.
  return true;
}

export function ProductPurchaseControls({
  product,
  locale,
  selectedSize,
  selectedColor,
  onSizeChange,
  onColorChange,
  onVariantChange,
}: ProductPurchaseControlsProps) {
  const allVariants = useMemo(() => product.variants, [product.variants]);
  const purchasableVariants = useMemo(
    () =>
      allVariants.filter((variant) =>
        isVariantPurchasable(variant, product.productStatus),
      ),
    [allVariants, product.productStatus],
  );

  const availableSizes = useMemo(
    () => unique(purchasableVariants.map((variant) => variant.size)),
    [purchasableVariants],
  );
  const allSizes = useMemo(
    () => unique(allVariants.map((variant) => variant.size)),
    [allVariants],
  );
  const sizes = useMemo(() => {
    const merged = [...STANDARD_SIZE_RANGE.filter((size) => allSizes.includes(size))];
    for (const size of allSizes) {
      if (!merged.includes(size)) {
        merged.push(size);
      }
    }
    return merged;
  }, [allSizes]);

  const colors = useMemo(() => {
    const sizeFiltered = selectedSize
      ? allVariants.filter((variant) => variant.size === selectedSize)
      : allVariants;
    return unique(sizeFiltered.map((variant) => variant.color));
  }, [allVariants, selectedSize]);
  const availableColors = useMemo(() => {
    const sizeFiltered = selectedSize
      ? purchasableVariants.filter((variant) => variant.size === selectedSize)
      : purchasableVariants;
    return unique(sizeFiltered.map((variant) => variant.color));
  }, [purchasableVariants, selectedSize]);

  const selectedVariant = useMemo(() => {
    const exactPurchasable = purchasableVariants.find((variant) => {
      const sizeMatch = selectedSize ? variant.size === selectedSize : true;
      const colorMatch = selectedColor ? variant.color === selectedColor : true;
      return sizeMatch && colorMatch;
    });
    if (exactPurchasable) {
      return exactPurchasable;
    }

    const exactAny = allVariants.find((variant) => {
      const sizeMatch = selectedSize ? variant.size === selectedSize : true;
      const colorMatch = selectedColor ? variant.color === selectedColor : true;
      return sizeMatch && colorMatch;
    });
    if (exactAny) {
      return exactAny;
    }

    if (selectedSize) {
      return (
        purchasableVariants.find((variant) => variant.size === selectedSize) ??
        allVariants.find((variant) => variant.size === selectedSize) ??
        null
      );
    }
    if (selectedColor) {
      return (
        purchasableVariants.find((variant) => variant.color === selectedColor) ??
        allVariants.find((variant) => variant.color === selectedColor) ??
        null
      );
    }
    return null;
  }, [allVariants, purchasableVariants, selectedSize, selectedColor]);
  const usesStyleOptions = useMemo(
    () =>
      colors.length > 0 &&
      colors.some((value) => !isLikelyColorValue(value)) &&
      !colors.every((value) => isLikelyColorValue(value)),
    [colors],
  );

  const hasVariantOptions =
    allVariants.length > 1 || allVariants.some((variant) => variant.size || variant.color);
  const selectedVariantPurchasable =
    selectedVariant == null ||
    isVariantPurchasable(selectedVariant, product.productStatus);
  const variantLabel =
    selectedVariant == null
      ? null
      : [selectedVariant.size, selectedVariant.color].filter(Boolean).join(" / ") || null;

  useEffect(() => {
    if (!hasVariantOptions || selectedVariant) {
      return;
    }

    const fallback = purchasableVariants[0] ?? allVariants[0];
    if (!fallback) {
      return;
    }

    if (!selectedSize && fallback.size) {
      onSizeChange(fallback.size);
    }
    if (!selectedColor && fallback.color) {
      onColorChange(fallback.color);
    }
  }, [
    allVariants,
    hasVariantOptions,
    onColorChange,
    onSizeChange,
    purchasableVariants,
    selectedColor,
    selectedSize,
    selectedVariant,
  ]);

  useEffect(() => {
    if (!selectedVariant || !selectedVariantPurchasable) {
      onVariantChange(null, variantLabel);
      return;
    }
    onVariantChange(selectedVariant.id, variantLabel);
  }, [onVariantChange, selectedVariant, selectedVariantPurchasable, variantLabel]);

  return (
    <div className="w-full space-y-4">
      {hasVariantOptions && (
        <div className="grid gap-3 sm:grid-cols-2">
          {sizes.length > 0 && (
            <label className="text-xs tracking-[0.16em] uppercase text-[--muted]">
              {t(locale, { en: "Size", ar: "المقاس", es: "Talla" })}
              <select
                value={selectedSize}
                onChange={(event) => {
                  onSizeChange(event.target.value);
                  onColorChange("");
                }}
                className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-sm text-[--ink] outline-none focus:border-[--ink]"
              >
                <option value="">{t(locale, { en: "Select size", ar: "اختاري المقاس", es: "Selecciona talla" })}</option>
                {sizes.map((size) => (
                  <option
                    key={size}
                    value={size}
                    disabled={!availableSizes.includes(size)}
                  >
                    {!availableSizes.includes(size)
                      ? locale === "ar"
                        ? `${size} (غير متوفر)`
                        : locale === "es"
                          ? `${size} (No disponible)`
                          : `${size} (Unavailable)`
                      : size}
                  </option>
                ))}
              </select>
            </label>
          )}
          {colors.length > 0 && (
            <label className="text-xs tracking-[0.16em] uppercase text-[--muted]">
              {usesStyleOptions
                ? t(locale, { en: "Style", ar: "الخيار", es: "Estilo" })
                : t(locale, { en: "Color", ar: "اللون", es: "Color" })}
              <select
                value={selectedColor}
                onChange={(event) => onColorChange(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-sm text-[--ink] outline-none focus:border-[--ink]"
              >
                <option value="">
                  {usesStyleOptions
                    ? t(locale, {
                        en: "Select option",
                        ar: "اختاري الخيار",
                        es: "Selecciona opcion",
                      })
                    : t(locale, {
                        en: "Select color",
                        ar: "اختاري اللون",
                        es: "Selecciona color",
                      })}
                </option>
                {colors.map((color) => (
                  <option key={color} value={color} disabled={!availableColors.includes(color)}>
                    {availableColors.includes(color)
                      ? color
                      : locale === "ar"
                        ? `${color} (غير متوفر)`
                        : locale === "es"
                          ? `${color} (No disponible)`
                          : `${color} (Unavailable)`}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      {selectedVariant && (
        <p className="text-xs tracking-[0.12em] uppercase text-[--muted]">
          {!selectedVariantPurchasable
            ? t(locale, {
                en: "Currently unavailable",
                ar: "غير متوفر حاليًا",
                es: "No disponible actualmente",
              })
            : selectedVariant.madeToOrder
            ? t(locale, { en: "Made to order", ar: "تفصيل حسب الطلب", es: "Hecho por encargo" })
            : product.productStatus === "LIMITED"
              ? locale === "ar"
                ? `كمية محدودة · ${selectedVariant.stockQuantity}`
                : locale === "es"
                  ? `Piezas limitadas · ${selectedVariant.stockQuantity}`
                  : `Limited pieces · ${selectedVariant.stockQuantity}`
              : t(locale, { en: "Available", ar: "متوفر", es: "Disponible" })}
        </p>
      )}

      <AddToCartButton
        productId={product.id}
        variantId={
          selectedVariant && selectedVariantPurchasable
            ? selectedVariant.id
            : null
        }
        variantLabel={variantLabel}
        requireVariant={hasVariantOptions}
        slug={product.slug}
        name={product.name}
        image={product.mainImage}
        currency={product.currency}
        unitPrice={product.salePrice ?? product.price}
        purchaseType={product.purchaseType}
        locale={locale}
        quantity={1}
      />
    </div>
  );
}
