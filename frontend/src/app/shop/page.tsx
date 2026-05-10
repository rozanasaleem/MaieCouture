import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/api";
import { ProductSummary } from "@/lib/types";
import { getLocaleFromCookies } from "@/lib/i18n-server";

type SearchParams = Promise<{
  category?: string;
  purchaseType?: string;
  label?: string;
  q?: string;
  subtype?: string;
}>;

type ShopHubCard = {
  slug: string;
  labelEn: string;
  labelAr: string;
  category: string;
};

type ReadyWearCard = {
  slug: string;
  labelEn: string;
  labelAr: string;
  subtype: string;
};

type BridalCard = {
  slug: string;
  labelEn: string;
  labelAr: string;
  subtype: string;
};

type AccessoriesCard = {
  slug: string;
  labelEn: string;
  labelAr: string;
  subtype: string;
};

const READY_WEAR_CARDS: ReadyWearCard[] = [
  { slug: "abayas", labelEn: "Abayas", labelAr: "عبايات", subtype: "abayas" },
  { slug: "jumpsuits", labelEn: "Jumpsuits", labelAr: "جمبسوت", subtype: "jumpsuits" },
  { slug: "sets", labelEn: "Sets", labelAr: "أطقم", subtype: "sets" },
  { slug: "tops-and-blouses", labelEn: "Tops & Blouses", labelAr: "توبات وبلوزات", subtype: "tops-and-blouses" },
  { slug: "vests-and-blazers", labelEn: "Vests & Blazers", labelAr: "فيستات وبلايزر", subtype: "vests-and-blazers" },
  { slug: "dresses", labelEn: "Dresses", labelAr: "فساتين", subtype: "dresses" },
];

const BRIDAL_CARDS: BridalCard[] = [
  { slug: "bridal-gowns", labelEn: "Bridal Gowns", labelAr: "فساتين الزفاف", subtype: "bridal-gowns" },
  { slug: "katb-ktab", labelEn: "Katb Ktab & Jaha Dresses", labelAr: "كتب كتاب وجاهة", subtype: "katb-ktab" },
  { slug: "henna-dresses", labelEn: "Henna Dresses", labelAr: "فساتين حنة", subtype: "henna-dresses" },
];

const ACCESSORIES_CARDS: AccessoriesCard[] = [
  { slug: "shoes", labelEn: "Shoes", labelAr: "أحذية", subtype: "shoes" },
  { slug: "bags", labelEn: "Bags", labelAr: "حقائب", subtype: "bags" },
  { slug: "clutches", labelEn: "Clutches", labelAr: "كلاتش", subtype: "clutches" },
  { slug: "scarves", labelEn: "Scarves", labelAr: "أوشحة", subtype: "scarves" },
];

const SHOP_HUB_CARDS: ShopHubCard[] = [
  {
    slug: "ready-to-wear",
    labelEn: "Ready to Wear",
    labelAr: "جاهز للارتداء",
    category: "ready-to-wear",
  },
  {
    slug: "accessories",
    labelEn: "Accessories",
    labelAr: "إكسسوارات",
    category: "accessories",
  },
  {
    slug: "home",
    labelEn: "Home",
    labelAr: "المنزل",
    category: "home",
  },
];

const SUBTYPE_TOKENS: Record<string, string[]> = {
  "ready-to-wear:abayas": ["abaya"],
  "ready-to-wear:jumpsuits": ["jumpsuit"],
  "ready-to-wear:sets": [" set ", " two piece", " two-piece", "coord", "co ord", "co-ord"],
  "ready-to-wear:tops-and-blouses": ["top", "blouse", "shirt"],
  "ready-to-wear:vests-and-blazers": ["vest", "blazer", "waistcoat", "outerwear"],
  "ready-to-wear:dresses": ["dress", "gown"],
  "bridal:bridal-gowns": [
    "bridal gown",
    "bridal-gown",
    "wedding gown",
    "wedding dress",
    "gown",
  ],
  "bridal:katb-ktab": [
    "katb",
    "ktab",
    "katb ktab",
    "katb-ktab",
    "kitab",
    "ketab",
    "engagement",
    "jaha",
    "jahaa",
    "جاهة",
    "كتب كتاب",
  ],
  "bridal:henna-dresses": ["henna", "حنة"],
  "accessories:shoes": ["shoe", "heels", "sandal"],
  "accessories:bags": ["bag", "handbag"],
  "accessories:clutches": ["clutch"],
  "accessories:scarves": ["scarf", "shawl"],
};

function normalizedProductText(product: ProductSummary) {
  return ` ${[product.name, product.shortDescription, product.category ?? "", product.slug]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")} `;
}

function matchesSubtype(
  product: ProductSummary,
  category: string | undefined,
  subtype: string | undefined,
) {
  if (!category || !subtype) {
    return true;
  }

  const key = `${category}:${subtype}`;
  const tokens = SUBTYPE_TOKENS[key];
  if (!tokens || tokens.length === 0) {
    return true;
  }

  const text = normalizedProductText(product);
  const hasToken = tokens.some((token) =>
    text.includes(` ${token.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim()} `),
  );

  // Bridal routing rule:
  // Treat Katb Ktab as the default bridal bucket when pieces are not explicitly
  // classified as Henna or Bridal Gown by text tokens.
  if (key === "bridal:katb-ktab") {
    if (hasToken) {
      return true;
    }
    const hennaTokens = SUBTYPE_TOKENS["bridal:henna-dresses"] ?? [];
    const gownTokens = SUBTYPE_TOKENS["bridal:bridal-gowns"] ?? [];
    const matchesHenna = hennaTokens.some((token) =>
      text.includes(` ${token.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim()} `),
    );
    const matchesGown = gownTokens.some((token) =>
      text.includes(` ${token.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim()} `),
    );
    return !matchesHenna && !matchesGown;
  }

  if (!hasToken) {
    return false;
  }

  // Keep jumpsuits and sets from leaking into dresses.
  if (key === "ready-to-wear:dresses") {
    const blocked = [" jumpsuit ", " set ", " two piece ", " two-piece ", "coord", "co ord", "co-ord"];
    return !blocked.some((term) => text.includes(term.replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")));
  }

  return true;
}

function matchesSearchQuery(product: ProductSummary, q: string | undefined) {
  if (!q) {
    return true;
  }

  const terms = q
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) {
    return true;
  }

  const text = normalizedProductText(product);
  return terms.every((term) => text.includes(term));
}

function cardImageFor(products: ProductSummary[], category: string, subtype: string) {
  const match = products.find((product) => {
    const productCategory = product.category?.toLowerCase().replaceAll(" ", "-");
    if (productCategory !== category) {
      return false;
    }
    return matchesSubtype(product, category, subtype);
  });
  return match?.mainImage ?? null;
}

function hasProductsForCategory(products: ProductSummary[], category: string) {
  return products.some(
    (product) => product.category?.toLowerCase().replaceAll(" ", "-") === category,
  );
}

function readableHeading(label?: string, category?: string) {
  if (label) {
    return label;
  }

  if (!category) {
    return "The Shop";
  }

  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const products = await getProducts();
  const locale = await getLocaleFromCookies();
  const isArabic = locale === "ar";
  const { category, purchaseType, label, q, subtype } = await searchParams;
  const showShopHub = !category && !q && !purchaseType && !subtype;

  // Show hub cards only on category landing.
  // Once a subtype is selected, render product results instead.
  const showReadyWearHub = category === "ready-to-wear" && !q && !subtype;
  const showBridalHub = category === "bridal" && !q && !subtype;
  const showAccessoriesHub = category === "accessories" && !q && !subtype;
  const categoryProducts = category
    ? products.filter(
        (product) =>
          product.category?.toLowerCase().replaceAll(" ", "-") === category,
      )
    : products;
  const visibleShopHubCards = SHOP_HUB_CARDS.filter((card) =>
    hasProductsForCategory(products, card.category),
  );
  const visibleReadyWearCards = READY_WEAR_CARDS.filter((card) =>
    categoryProducts.some((product) =>
      matchesSubtype(product, "ready-to-wear", card.subtype),
    ),
  );
  const visibleBridalCards = BRIDAL_CARDS.filter((card) =>
    categoryProducts.some((product) => matchesSubtype(product, "bridal", card.subtype)),
  );
  const visibleAccessoriesCards = ACCESSORIES_CARDS.filter((card) =>
    categoryProducts.some((product) =>
      matchesSubtype(product, "accessories", card.subtype),
    ),
  );
  const filteredProducts = products.filter((product) => {
    const matchesCategory = category
      ? product.category?.toLowerCase().replaceAll(" ", "-") === category
      : true;

    const matchesPurchaseType = purchaseType
      ? product.purchaseType === purchaseType
      : true;

    const matchesSubtypeFilter = matchesSubtype(product, category, subtype);
    const matchesQuery = matchesSearchQuery(product, q);

    return matchesCategory && matchesPurchaseType && matchesSubtypeFilter && matchesQuery;
  });

  const heading = readableHeading(label, category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="max-w-3xl">
        <p className="text-xs tracking-[0.26em] uppercase text-[--muted]">
          {category || purchaseType
            ? isArabic
              ? "تشكيلة مختارة"
              : "Curated edit"
            : isArabic
              ? "المتجر"
              : "The shop"}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[2rem] text-[--ink] sm:text-[2.4rem]">
          {heading}
        </h1>
        {purchaseType === "APPOINTMENT_ONLY" && (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[--muted]">
            {isArabic
              ? "هذه القطع مخصصة للاستكشاف وحجز موعد خاص، وليست للشراء المباشر عبر السلة."
              : "These pieces are view-only and available through private appointment."}
          </p>
        )}
      </div>

      {showReadyWearHub ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {visibleReadyWearCards.map((card) => {
            const image = cardImageFor(products, "ready-to-wear", card.subtype);
            return (
              <Link
                key={card.slug}
                href={`/shop?category=ready-to-wear&label=${encodeURIComponent(isArabic ? card.labelAr : card.labelEn)}&subtype=${encodeURIComponent(card.subtype)}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-md border border-[--line] bg-[linear-gradient(180deg,#f7f4ee_0%,#ece5da_100%)]"
              >
                {image && (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
                    style={{ backgroundImage: `url(${image})` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/16 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-[family-name:var(--font-display)] text-lg text-white sm:text-xl">
                    {isArabic ? card.labelAr : card.labelEn}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : showBridalHub ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {visibleBridalCards.map((card) => {
            const image = cardImageFor(products, "bridal", card.subtype);
            return (
              <Link
                key={card.slug}
                href={`/shop?category=bridal&label=${encodeURIComponent(isArabic ? card.labelAr : card.labelEn)}&subtype=${encodeURIComponent(card.subtype)}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-md border border-[--line] bg-[linear-gradient(180deg,#f7f4ee_0%,#ece5da_100%)]"
              >
                {image && (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
                    style={{ backgroundImage: `url(${image})` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/16 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-[family-name:var(--font-display)] text-lg text-white sm:text-xl">
                    {isArabic ? card.labelAr : card.labelEn}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : showAccessoriesHub ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {visibleAccessoriesCards.map((card) => {
            const image = cardImageFor(products, "accessories", card.subtype);
            return (
              <Link
                key={card.slug}
                href={`/shop?category=accessories&label=${encodeURIComponent(isArabic ? card.labelAr : card.labelEn)}&subtype=${encodeURIComponent(card.subtype)}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-md border border-[--line] bg-[linear-gradient(180deg,#f7f4ee_0%,#ece5da_100%)]"
              >
                {image && (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
                    style={{ backgroundImage: `url(${image})` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/16 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-[family-name:var(--font-display)] text-lg text-white sm:text-xl">
                    {isArabic ? card.labelAr : card.labelEn}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : showShopHub ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleShopHubCards.map((card) => {
            const image = products.find(
              (product) =>
                product.category?.toLowerCase().replaceAll(" ", "-") ===
                card.category,
            )?.mainImage;
            return (
              <Link
                key={card.slug}
                href={`/shop?category=${encodeURIComponent(card.category)}&label=${encodeURIComponent(
                  isArabic ? card.labelAr : card.labelEn,
                )}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-md border border-[--line] bg-[linear-gradient(180deg,#f7f4ee_0%,#ece5da_100%)]"
              >
                {image && (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
                    style={{ backgroundImage: `url(${image})` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/16 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-[family-name:var(--font-display)] text-lg text-white sm:text-xl">
                    {isArabic ? card.labelAr : card.labelEn}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="mt-10 rounded-[2rem] border border-[--line] bg-[var(--panel)] px-6 py-8 text-sm text-[--muted]">
          {isArabic
            ? "لا توجد قطع مطابقة في هذا القسم حالياً."
            : "No matching pieces were found in this section right now."}
        </div>
      )}
    </div>
  );
}
