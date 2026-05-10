import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/product-detail-client";
import { getProduct } from "@/lib/api";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocaleFromCookies();
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} locale={locale} />;
}
