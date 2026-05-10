"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PriceDisplay } from "@/components/price-display";
import { ProductPurchaseControls } from "@/components/product-purchase-controls";
import { SizeGuideLightbox } from "@/components/size-guide-lightbox";
import { ProductDetail } from "@/lib/types";

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const COLOR_HINTS: Record<string, string[]> = {
  olive: ["olive", "green", "khaki", "army", "sage"],
  green: ["green", "olive", "khaki", "sage"],
  red: ["red", "pomegranate", "burgundy", "maroon", "crimson"],
  pomegranate: ["pomegranate", "red", "burgundy", "maroon"],
  blue: ["blue", "navy", "azure", "royal"],
  white: ["white", "ivory", "offwhite", "off white", "cream"],
  black: ["black", "ebony", "charcoal"],
  beige: ["beige", "sand", "camel", "nude", "taupe"],
  gold: ["gold", "golden", "champagne"],
  silver: ["silver", "grey", "gray", "metallic"],
};

function colorSearchTokens(selectedColor: string) {
  const base = normalizeToken(selectedColor).split(" ").filter(Boolean);
  const expanded = new Set<string>(base);
  for (const token of base) {
    const hints = COLOR_HINTS[token] ?? [];
    for (const hint of hints) {
      expanded.add(normalizeToken(hint));
    }
  }
  return [...expanded].filter(Boolean);
}

function imageForSelectedColor(
  selectedColor: string,
  mainImage: string | null,
  galleryImages: string[],
) {
  if (!selectedColor) {
    return mainImage;
  }

  const images = [mainImage, ...galleryImages].filter(
    (image): image is string => Boolean(image),
  );
  if (images.length === 0) {
    return null;
  }

  const colorTokens = colorSearchTokens(selectedColor);
  const match = images.find((image) => {
    const normalizedImage = normalizeToken(image);
    return colorTokens.some((token) => normalizedImage.includes(token));
  });

  return match ?? mainImage ?? images[0];
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function localizedField(value: string | null | undefined, locale: "en" | "ar") {
  if (!value) {
    return "";
  }

  // Supported authoring formats:
  // 1) "English text || Arabic text"
  // 2) "[en]English text[/en][ar]النص العربي[/ar]"
  const trimmed = value.trim();

  const bracketMatch = trimmed.match(/\[en\]([\s\S]*?)\[\/en\][\s\S]*?\[ar\]([\s\S]*?)\[\/ar\]/i);
  if (bracketMatch) {
    return locale === "ar" ? bracketMatch[2].trim() : bracketMatch[1].trim();
  }

  const pipeParts = trimmed.split("||").map((part) => part.trim()).filter(Boolean);
  if (pipeParts.length >= 2) {
    return locale === "ar" ? pipeParts[1] : pipeParts[0];
  }

  return trimmed;
}

export function ProductDetailClient({
  product,
  locale,
}: {
  product: ProductDetail;
  locale: "en" | "ar";
}) {
  const isArabic = locale === "ar";
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const normalizedPurchaseType = String(product.purchaseType ?? "")
    .trim()
    .toUpperCase();
  const appointmentOnlyFlow = normalizedPurchaseType !== "DIRECT_PURCHASE";
  const localizedShortDescription = localizedField(product.shortDescription, locale);
  const localizedFullDescription = localizedField(product.fullDescription, locale);
  const localizedLeadTimeNote = localizedField(product.leadTimeNote, locale);

  const colorDrivenImage = useMemo(
    () => imageForSelectedColor(selectedColor, product.mainImage, product.galleryImages),
    [selectedColor, product.galleryImages, product.mainImage],
  );
  const gallery = useMemo(
    () => {
      const all = [product.mainImage, ...product.galleryImages].filter(
        (image): image is string => Boolean(image),
      );
      return [...new Set(all)];
    },
    [product.galleryImages, product.mainImage],
  );
  const activeImage =
    selectedImage && gallery.includes(selectedImage)
      ? selectedImage
      : colorDrivenImage ?? gallery[0] ?? null;
  const activeImageIndex = activeImage ? gallery.indexOf(activeImage) : -1;

  function showPreviousImage() {
    if (gallery.length <= 1) {
      return;
    }
    const currentIndex = activeImageIndex >= 0 ? activeImageIndex : 0;
    const nextIndex = (currentIndex - 1 + gallery.length) % gallery.length;
    setSelectedImage(gallery[nextIndex]);
  }

  function showNextImage() {
    if (gallery.length <= 1) {
      return;
    }
    const currentIndex = activeImageIndex >= 0 ? activeImageIndex : 0;
    const nextIndex = (currentIndex + 1) % gallery.length;
    setSelectedImage(gallery[nextIndex]);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[5.5rem_1fr]">
            {gallery.length > 1 && (
              <div className="order-2 -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 lg:order-1 lg:mx-0 lg:grid lg:grid-cols-1 lg:overflow-visible lg:px-0 lg:pb-0 lg:content-start">
                {gallery.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-[--sand] transition lg:h-auto lg:w-auto lg:aspect-square ${
                      activeImage === image
                        ? "border-[--ink]"
                        : "border-[--line] hover:border-[--muted]"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} view`}
                      className="h-full w-full object-cover object-center"
                    />
                  </button>
                ))}
              </div>
            )}
            <div
              className="order-1 relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-[--line] bg-[radial-gradient(circle_at_top,rgba(205,188,166,0.45),transparent_60%),linear-gradient(180deg,#ded2c0_0%,#f8f2ea_100%)] lg:order-2"
            >
              {activeImage && (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="h-full w-full object-cover object-center"
                />
              )}
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-black/30 px-2 py-1 text-lg leading-none text-white backdrop-blur-sm transition hover:bg-black/45"
                    aria-label={isArabic ? "الصورة السابقة" : "Previous image"}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-black/30 px-2 py-1 text-lg leading-none text-white backdrop-blur-sm transition hover:bg-black/45"
                    aria-label={isArabic ? "الصورة التالية" : "Next image"}
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-7">
          <div>
            <p className="text-xs tracking-[0.26em] uppercase text-[--muted]">
              {product.category}
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl lg:text-6xl">
              {product.name}
            </h1>
            <p className="mt-4 text-sm leading-7 text-[--muted]">
              {stripHtml(localizedShortDescription)}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[--line] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:p-7">
            <p className="font-[family-name:var(--font-display)] text-4xl text-[--ink]">
              <PriceDisplay
                amount={product.salePrice ?? product.price}
                currency={product.currency}
                fallback={isArabic ? "السعر عند الطلب" : "Available on request"}
              />
            </p>
            <div className="mt-4">
              <SizeGuideLightbox />
            </div>
            {!appointmentOnlyFlow ? (
              <div className="mt-6 space-y-3">
                <ProductPurchaseControls
                  product={product}
                  locale={locale}
                  selectedSize={selectedSize}
                  selectedColor={selectedColor}
                  onSizeChange={setSelectedSize}
                  onColorChange={(color) => {
                    setSelectedColor(color);
                    // Clear manual image pin so color selection can drive gallery image.
                    setSelectedImage(null);
                  }}
                  onVariantChange={() => {}}
                />
                {localizedLeadTimeNote && (
                  <p className="text-xs leading-6 text-[--muted]">
                    <span className="mr-2 tracking-[0.18em] uppercase text-[--ink]/80">
                      {isArabic ? "المدة التقديرية:" : "Estimated lead time:"}
                    </span>
                    {localizedLeadTimeNote}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <Link
                  href="/contact"
                  className="inline-flex rounded-full bg-[--ink] px-6 py-3 text-xs tracking-[0.24em] uppercase text-white transition hover:bg-[#2f2419]"
                >
                  {isArabic ? "احجز موعدًا" : "Book appointment"}
                </Link>
                {localizedLeadTimeNote && (
                  <p className="text-xs leading-6 text-[--muted]">
                    <span className="mr-2 tracking-[0.18em] uppercase text-[--ink]/80">
                      {isArabic ? "المدة التقديرية:" : "Estimated lead time:"}
                    </span>
                    {localizedLeadTimeNote}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-[--line] bg-[--panel] p-5 sm:p-7">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[--ink]">
              {isArabic ? "التفاصيل" : "Details"}
            </h2>
            <p className="mt-4 text-sm leading-8 text-[--muted]">
              {stripHtml(localizedFullDescription)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
