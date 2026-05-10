"use client";

import { useEffect, useMemo } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductDetail } from "@/lib/types";

type ProductPurchaseControlsProps = {
  product: ProductDetail;
  locale: "en" | "ar";
  selectedSize: string;
  selectedColor: string;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
  onVariantChange: (variantId: number | null, variantLabel: string | null) => void;
};

const STANDARD_SIZE_RANGE = ["XS", "S", "M", "L", "XL"];

function unique(values: Array<string | null>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
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
  const isArabic = locale === "ar";
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
              {isArabic ? "المقاس" : "Size"}
              <select
                value={selectedSize}
                onChange={(event) => {
                  onSizeChange(event.target.value);
                  onColorChange("");
                }}
                className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-sm text-[--ink] outline-none focus:border-[--ink]"
              >
                <option value="">{isArabic ? "اختاري المقاس" : "Select size"}</option>
                {sizes.map((size) => (
                  <option
                    key={size}
                    value={size}
                    disabled={!availableSizes.includes(size)}
                  >
                    {!availableSizes.includes(size)
                      ? isArabic
                        ? `${size} (غير متوفر)`
                        : `${size} (Unavailable)`
                      : size}
                  </option>
                ))}
              </select>
            </label>
          )}
          {colors.length > 0 && (
            <label className="text-xs tracking-[0.16em] uppercase text-[--muted]">
              {isArabic ? "اللون" : "Color"}
              <select
                value={selectedColor}
                onChange={(event) => onColorChange(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[--line] px-3 py-3 text-sm text-[--ink] outline-none focus:border-[--ink]"
              >
                <option value="">{isArabic ? "اختاري اللون" : "Select color"}</option>
                {colors.map((color) => (
                  <option key={color} value={color} disabled={!availableColors.includes(color)}>
                    {availableColors.includes(color)
                      ? color
                      : isArabic
                        ? `${color} (غير متوفر)`
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
            ? isArabic
              ? "غير متوفر حاليًا"
              : "Currently unavailable"
            : selectedVariant.madeToOrder
            ? isArabic
              ? "تفصيل حسب الطلب"
              : "Made to order"
            : product.productStatus === "LIMITED"
              ? isArabic
                ? `كمية محدودة · ${selectedVariant.stockQuantity}`
                : `Limited pieces · ${selectedVariant.stockQuantity}`
              : isArabic
                ? "متوفر"
                : "Available"}
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
