import Link from "next/link";
import { PriceDisplay } from "@/components/price-display";
import { Locale } from "@/lib/i18n-shared";
import { ProductSummary } from "@/lib/types";

function localizedField(value: string | null | undefined, locale: Locale) {
  if (!value) {
    return "";
  }

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

function cleanDescription(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function ProductCard({
  product,
  locale,
}: {
  product: ProductSummary;
  locale: Locale;
}) {
  const shortDescription = cleanDescription(localizedField(product.shortDescription, locale));
  const normalizedPurchaseType = String(product.purchaseType ?? "")
    .trim()
    .toUpperCase();
  const appointmentOnlyFlow = normalizedPurchaseType !== "DIRECT_PURCHASE";

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-md border border-[--line] bg-[var(--panel)] shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition duration-500 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(0,0,0,0.08)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[linear-gradient(180deg,#f8f8f8_0%,#f2f2f2_52%,#e9e9e9_100%)]">
        {product.mainImage && (
          <div
            className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
            style={{ backgroundImage: `url(${product.mainImage})` }}
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_35%,rgba(0,0,0,0.22)_100%)]" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[9px] tracking-[0.18em] uppercase text-white/80">
            {product.category ?? "Maison"}
          </p>
          <h3 className="mt-1 max-w-[13ch] font-[family-name:var(--font-display)] text-2xl leading-[0.96] text-white">
            {product.name}
          </h3>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
        {shortDescription ? (
          <p className="text-sm leading-7 text-[--muted]">
            {shortDescription}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 text-sm">
          {appointmentOnlyFlow ? (
            <span className="text-[11px] tracking-[0.22em] uppercase text-[--muted]">
              {locale === "ar"
                ? "بموعد خاص"
                : locale === "es"
                  ? "Solo con cita"
                  : "By appointment"}
            </span>
          ) : (
            <span className="font-[family-name:var(--font-display)] text-xl text-[--ink]">
              <PriceDisplay
                amount={product.salePrice ?? product.price}
                currency={product.currency}
              />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
