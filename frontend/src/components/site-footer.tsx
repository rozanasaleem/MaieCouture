import Link from "next/link";
import { Locale, t } from "@/lib/i18n-shared";

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="mt-20 border-t border-[--line] bg-[rgba(252,251,248,0.92)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr] lg:px-10">
        <div className="space-y-4">
          <p className="font-[family-name:var(--font-display)] text-2xl leading-tight text-[--ink]">Maie Couture</p>
          <p className="max-w-xl text-sm leading-7 text-[--muted]">
            {t(locale, {
              en: "Where heritage meets modern sophistication. Each piece is thoughtfully designed and handcrafted, honoring tradition while embracing contemporary elegance.",
              ar: "حيث يلتقي التراث بالرقي العصري. كل قطعة تُصمم وتُنفّذ بعناية، تكريمًا للتقاليد مع لمسة معاصرة.",
              es: "Donde el patrimonio se encuentra con la sofisticacion moderna. Cada pieza esta disenada y confeccionada con cuidado, honrando la tradicion con una elegancia contemporanea.",
            })}
          </p>
        </div>

        <div className="space-y-3 text-sm text-[--muted]">
          <h3 className="text-xs tracking-[0.24em] uppercase text-[--ink]">
            {t(locale, { en: "Explore", ar: "استكشف", es: "Explorar" })}
          </h3>
          <Link href="/shop?category=bridal&label=Bridal" className="block hover:text-[--ink]">
            {t(locale, { en: "Bridal", ar: "العرائس", es: "Novias" })}
          </Link>
          <Link
            href="/shop?category=ready-to-wear&label=Ready%20to%20Wear"
            className="block hover:text-[--ink]"
          >
            {t(locale, { en: "Ready to Wear", ar: "جاهز للارتداء", es: "Listo para usar" })}
          </Link>
          <Link href="/shop?category=evening-wear&label=Evening%20Wear" className="block hover:text-[--ink]">
            {t(locale, { en: "Evening Wear", ar: "ملابس السهرة", es: "Ropa de noche" })}
          </Link>
        </div>

        <div className="space-y-3 text-sm text-[--muted]">
          <h3 className="text-xs tracking-[0.24em] uppercase text-[--ink]">
            {t(locale, { en: "Services", ar: "الخدمات", es: "Servicios" })}
          </h3>
          <Link href="/boutiques" className="block hover:text-[--ink]">
            {t(locale, { en: "Visit our boutiques", ar: "زيارة البوتيك", es: "Visitar nuestras boutiques" })}
          </Link>
          <Link href="/contact" className="block hover:text-[--ink]">
            {t(locale, { en: "Book an appointment", ar: "حجز موعد", es: "Reservar una cita" })}
          </Link>
          <Link href="/contact" className="block hover:text-[--ink]">
            {t(locale, { en: "Private request", ar: "طلب خاص", es: "Solicitud privada" })}
          </Link>
        </div>

        <div className="space-y-3 text-sm text-[--muted]">
          <h3 className="text-xs tracking-[0.24em] uppercase text-[--ink]">
            {t(locale, { en: "Contact", ar: "تواصل", es: "Contacto" })}
          </h3>
          <p>atelier@maiecouture.com</p>
          <p>{t(locale, { en: "Ramallah, Palestine", ar: "رام الله، فلسطين", es: "Ramala, Palestina" })}</p>
          <p>
            {t(locale, {
              en: "Virtual and in-person consultations available",
              ar: "استشارات افتراضية وحضورية متاحة",
              es: "Consultas virtuales y presenciales disponibles",
            })}
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
