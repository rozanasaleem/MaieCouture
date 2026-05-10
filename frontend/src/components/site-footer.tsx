import Link from "next/link";
import { Locale } from "@/lib/i18n-shared";

export function SiteFooter({ locale }: { locale: Locale }) {
  const isArabic = locale === "ar";
  return (
    <footer className="mt-20 border-t border-[--line] bg-[rgba(252,251,248,0.92)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr] lg:px-10">
        <div className="space-y-4">
          <p className="font-[family-name:var(--font-display)] text-2xl leading-tight text-[--ink]">
            {isArabic
              ? "Maie Couture"
              : "Maie Couture"}
          </p>
          <p className="max-w-xl text-sm leading-7 text-[--muted]">
            {isArabic
              ? "حيث يلتقي التراث بالرقي العصري. كل قطعة تُصمم وتُنفّذ بعناية، تكريمًا للتقاليد مع لمسة معاصرة."
              : "Where heritage meets modern sophistication. Each piece is thoughtfully designed and handcrafted, honoring tradition while embracing contemporary elegance."}
          </p>
        </div>

        <div className="space-y-3 text-sm text-[--muted]">
          <h3 className="text-xs tracking-[0.24em] uppercase text-[--ink]">
            {isArabic ? "استكشف" : "Explore"}
          </h3>
          <Link href="/shop?category=bridal&label=Bridal" className="block hover:text-[--ink]">
            {isArabic ? "العرائس" : "Bridal"}
          </Link>
          <Link
            href="/shop?category=ready-to-wear&label=Ready%20to%20Wear"
            className="block hover:text-[--ink]"
          >
            {isArabic ? "جاهز للارتداء" : "Ready to Wear"}
          </Link>
          <Link href="/shop?category=evening-wear&label=Evening%20Wear" className="block hover:text-[--ink]">
            {isArabic ? "ملابس السهرة" : "Evening Wear"}
          </Link>
        </div>

        <div className="space-y-3 text-sm text-[--muted]">
          <h3 className="text-xs tracking-[0.24em] uppercase text-[--ink]">
            {isArabic ? "الخدمات" : "Services"}
          </h3>
          <Link href="/boutiques" className="block hover:text-[--ink]">
            {isArabic ? "زيارة البوتيك" : "Visit our boutiques"}
          </Link>
          <Link href="/contact" className="block hover:text-[--ink]">
            {isArabic ? "حجز موعد" : "Book an appointment"}
          </Link>
          <Link href="/contact" className="block hover:text-[--ink]">
            {isArabic ? "طلب خاص" : "Private request"}
          </Link>
        </div>

        <div className="space-y-3 text-sm text-[--muted]">
          <h3 className="text-xs tracking-[0.24em] uppercase text-[--ink]">
            {isArabic ? "تواصل" : "Contact"}
          </h3>
          <p>atelier@maiecouture.com</p>
          <p>{isArabic ? "رام الله، فلسطين" : "Ramallah, Palestine"}</p>
          <p>
            {isArabic
              ? "استشارات افتراضية وحضورية متاحة"
              : "Virtual and in-person consultations available"}
          </p>
          <div className="pt-2 text-[11px] tracking-[0.14em] uppercase">
            <a href="#" className="mr-3 hover:text-[--ink]">
              Instagram
            </a>
            <a href="#" className="mr-3 hover:text-[--ink]">
              Facebook
            </a>
            <a href="#" className="hover:text-[--ink]">
              TikTok
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
