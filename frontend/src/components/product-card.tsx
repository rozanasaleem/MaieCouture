import Link from "next/link";
import { PriceDisplay } from "@/components/price-display";
import { ProductSummary } from "@/lib/types";

export function ProductCard({ product }: { product: ProductSummary }) {
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
        <p className="text-sm leading-7 text-[--muted]">
          {product.shortDescription}
        </p>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-[family-name:var(--font-display)] text-xl text-[--ink]">
            <PriceDisplay
              amount={product.salePrice ?? product.price}
              currency={product.currency}
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
