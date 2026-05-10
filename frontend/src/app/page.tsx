import Image from "next/image";
import Link from "next/link";
import { ReadyToWearCarousel } from "@/components/ready-to-wear-carousel";
import { getProducts } from "@/lib/api";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import { ProductSummary } from "@/lib/types";

const COMING_SOON_MODE = process.env.NEXT_PUBLIC_COMING_SOON === "true";

const READY_WEAR_CARDS = [
  { slug: "abayas", labelEn: "Abayas", labelAr: "عبايات", subtype: "abayas" },
  { slug: "jumpsuits", labelEn: "Jumpsuits", labelAr: "جمبسوت", subtype: "jumpsuits" },
  { slug: "sets", labelEn: "Sets", labelAr: "أطقم", subtype: "sets" },
  { slug: "tops-and-blouses", labelEn: "Tops & Blouses", labelAr: "توبات وبلوزات", subtype: "tops-and-blouses" },
  { slug: "vests-and-blazers", labelEn: "Vests & Blazers", labelAr: "فيستات وبلايزر", subtype: "vests-and-blazers" },
  { slug: "dresses", labelEn: "Dresses", labelAr: "فساتين", subtype: "dresses" },
] as const;

const READY_WEAR_SUBTYPE_TOKENS: Record<string, string[]> = {
  abayas: ["abaya"],
  jumpsuits: ["jumpsuit"],
  sets: [" set ", " two piece", " two-piece", "coord", "co ord", "co-ord"],
  "tops-and-blouses": ["top", "blouse", "shirt"],
  "vests-and-blazers": ["vest", "blazer", "waistcoat", "outerwear"],
  dresses: ["dress", "gown"],
};

const FOUNDER_GALLERY_IMAGES = [
  "/founder-media/web/dsc06207.jpg",
  "/founder-media/web/dsc05855-2.jpg",
  "/founder-media/web/dsc06482-2.jpg",
  "/founder-media/web/dsc04909.jpg",
];

function normalizedProductText(product: ProductSummary) {
  return ` ${[product.name, product.shortDescription, product.category ?? "", product.slug]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")} `;
}

function matchesReadyWearSubtype(product: ProductSummary, subtype: string) {
  const tokens = READY_WEAR_SUBTYPE_TOKENS[subtype] ?? [];
  if (tokens.length === 0) return true;

  const text = normalizedProductText(product);
  const hasToken = tokens.some((token) =>
    text.includes(` ${token.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim()} `),
  );
  if (!hasToken) return false;

  if (subtype === "dresses") {
    const blocked = [" jumpsuit ", " set ", " two piece ", " two-piece ", "coord", "co ord", "co-ord"];
    return !blocked.some((term) => text.includes(term.replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")));
  }
  return true;
}

export default async function Home() {
  const locale = await getLocaleFromCookies();
  const isArabic = locale === "ar";
  const heroImageSrc =
    process.env.NEXT_PUBLIC_HERO_IMAGE_PATH ?? "/hero-image.jpg";

  if (COMING_SOON_MODE) {
    return (
      <div className="relative min-h-[100svh] overflow-hidden">
        <Image
          src={heroImageSrc}
          alt={isArabic ? "صورة الغلاف" : "Maie Couture hero"}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.28),rgba(0,0,0,0.45))]" />

        <section className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl items-center px-6 py-24 text-white sm:px-10">
          <div className="max-w-xl">
            <p className="text-xs tracking-[0.28em] uppercase text-white/80">
              {isArabic ? "مي سلامة كوتور" : "Maie Salameh Couture"}
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-tight sm:text-6xl">
              {isArabic ? "قريبًا" : "Coming Soon"}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/85 sm:text-base">
              {isArabic
                ? "نجهّز تجربة تسوّق جديدة تجمع بين الحرفية الفلسطينية والرقي المعاصر. ترقبوا الإطلاق قريبًا."
                : "We are preparing a refined new online experience that blends Palestinian craftsmanship with modern elegance. Launching soon."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex rounded-full bg-white px-6 py-3 text-[10px] tracking-[0.2em] uppercase text-[--ink] transition hover:bg-white/90"
              >
                {isArabic ? "تواصلوا معنا" : "Contact Us"}
              </Link>
              <Link
                href="/boutiques"
                className="inline-flex rounded-full border border-white/60 px-6 py-3 text-[10px] tracking-[0.2em] uppercase text-white transition hover:bg-white/10"
              >
                {isArabic ? "فروعنا" : "Visit Boutiques"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const products = await getProducts();
  const founderImageSrc =
    process.env.NEXT_PUBLIC_MAIE_FOUNDER_IMAGE ??
    "/maie-founder.jpg";
  const readyWearCards = READY_WEAR_CARDS.map((card) => {
    const image =
      products.find((product) => {
        const productCategory = product.category?.toLowerCase().replaceAll(" ", "-");
        if (productCategory !== "ready-to-wear") return false;
        return matchesReadyWearSubtype(product, card.subtype);
      })?.mainImage ?? null;

    return {
      slug: card.slug,
      image,
      label: isArabic ? card.labelAr : card.labelEn,
      href: `/shop?category=ready-to-wear&label=${encodeURIComponent(
        isArabic ? card.labelAr : card.labelEn,
      )}&subtype=${encodeURIComponent(card.subtype)}`,
    };
  });

  return (
    <div className="pb-16">
      <section className="px-0 pt-0">
        <div className="relative min-h-[100svh] overflow-hidden border-b border-[--line]">
          <Image
            src={heroImageSrc}
            alt={isArabic ? "صورة الغلاف" : "Maie Couture hero"}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.03),rgba(0,0,0,0.24))]" />
        </div>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6 lg:px-10">
          <Link
            href="/shop"
            className="rounded-full bg-[--ink] px-6 py-3 text-[10px] tracking-[0.18em] uppercase text-white transition hover:opacity-90"
          >
            {isArabic ? "تسوق التشكيلة" : "Shop Collection"}
          </Link>
        </div>
      </section>

      <ReadyToWearCarousel
        title={isArabic ? "تسوق الجاهز للارتداء" : "Shop Ready-to-Wear"}
        cards={readyWearCards}
      />

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-10">
        <p className="text-center font-[family-name:var(--font-display)] text-xl text-[--rose] sm:text-2xl">
          {isArabic
            ? "حيث يلتقي التراث بالرقي العصري"
            : "Where heritage meets modern sophistication"}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="grid gap-5 rounded-2xl border border-[--line] bg-white p-4 sm:p-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-6">
          <div
            className="aspect-[4/5] max-h-[28rem] overflow-hidden rounded-xl bg-[linear-gradient(180deg,#f3ede3_0%,#dfd2c3_100%)] bg-cover bg-center"
            style={{ backgroundImage: `url(${founderImageSrc})` }}
            aria-label={isArabic ? "صورة ماي سلامة" : "Photo of Maie Salameh"}
          />

          <div className="flex flex-col justify-center">
            <p className="text-xs tracking-[0.24em] uppercase text-[--muted]">
              {isArabic ? "نبذة" : "Founder"}
            </p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[--ink] sm:text-[2rem]">
              {isArabic ? "مي سلامة" : "Maie Salameh"}
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[--muted]">
              {isArabic
                ? "مصممة فلسطينية من رام الله تجمع في تصاميمها بين تطريز فلسطين الأصيل والقصّات المعاصرة، لتقديم قطع تحافظ على الهوية وتعبّر عن القوة والجمال."
                : "A Palestinian designer from Ramallah blending traditional Palestinian embroidery with modern couture silhouettes, preserving heritage through refined contemporary pieces."}
            </p>
            <div className="mt-4">
              <Link
                href="/about"
                className="inline-flex rounded-full border border-[--line] px-4 py-2 text-[10px] tracking-[0.16em] uppercase text-[--ink] transition hover:bg-[--stone]"
              >
                {isArabic ? "اقرئي المزيد" : "Read more"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-10 lg:py-4">
        <div className="mb-4 flex items-end justify-between gap-3">
          <p className="text-xs tracking-[0.24em] uppercase text-[--muted]">
            {isArabic ? "حكاية بصرية" : "Visual Story"}
          </p>
        </div>

        <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative self-start overflow-hidden rounded-2xl border border-[--line]">
            <div className="relative aspect-[4/5]">
              <Image
                src={FOUNDER_GALLERY_IMAGES[0]}
                alt="Maie Couture visual 1"
                fill
                sizes="(min-width:1024px) 24vw, (min-width:640px) 48vw, 95vw"
                className="object-cover object-center"
              />
            </div>
          </div>

          <div className="relative self-start overflow-hidden rounded-2xl border border-[--line]">
            <div className="relative aspect-[4/5]">
              <Image
                src={FOUNDER_GALLERY_IMAGES[1]}
                alt="Maie Couture visual 2"
                fill
                sizes="(min-width:1024px) 24vw, (min-width:640px) 48vw, 95vw"
                className="object-cover object-center"
              />
            </div>
          </div>

          <div className="relative self-start overflow-hidden rounded-2xl border border-[--line] bg-black">
            <div className="relative aspect-[4/5]">
              <video
                className="h-full w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              >
                <source src="/founder-media/founder-reel.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

          <div className="relative self-start overflow-hidden rounded-2xl border border-[--line]">
            <div className="relative aspect-[4/5]">
              <Image
                src={FOUNDER_GALLERY_IMAGES[3]}
                alt="Maie Couture visual 3"
                fill
                sizes="(min-width:1024px) 24vw, (min-width:640px) 48vw, 95vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
