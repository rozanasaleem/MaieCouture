import Link from "next/link";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import { t } from "@/lib/i18n-shared";

type Branch = {
  nameEn: string;
  nameAr: string;
  nameEs: string;
  areaEn: string;
  areaAr: string;
  areaEs: string;
  addressEn: string;
  addressAr: string;
  addressEs: string;
  phone?: string;
  hoursEn: string;
  hoursAr: string;
  hoursEs: string;
  mapsQuery: string;
  mapsUrl?: string;
  walkIn: boolean;
};

const BRANCHES: Branch[] = [
  {
    nameEn: "Ramallah - Al Nijmeh Mall",
    nameAr: "رام الله - النجمة مول",
    nameEs: "Ramala - Al Nijmeh Mall",
    areaEn: "Ramallah, Palestine",
    areaAr: "رام الله، فلسطين",
    areaEs: "Ramala, Palestina",
    addressEn: "Al Nijmeh Mall, Irsal Street, 5th Floor.",
    addressAr: "النجمة مول، شارع الإرسال، الطابق الخامس.",
    addressEs: "Al Nijmeh Mall, calle Irsal, quinto piso.",
    hoursEn: "By appointment",
    hoursAr: "حسب المواعيد",
    hoursEs: "Con cita previa",
    mapsQuery: "Al Nijmeh Mall Irsal Street Ramallah",
    mapsUrl: "https://maps.app.goo.gl/kaDc7vXAPQtBCYHj7",
    walkIn: false,
  },
  {
    nameEn: "Ramallah - Sham Center",
    nameAr: "رام الله - شام سنتر",
    nameEs: "Ramala - Sham Center",
    areaEn: "Ramallah, Palestine",
    areaAr: "رام الله، فلسطين",
    areaEs: "Ramala, Palestina",
    addressEn: "Sham Center, Al Ahliyyeh Street, 7th Floor.",
    addressAr: "شام سنتر، شارع الأهلية، الطابق السابع.",
    addressEs: "Sham Center, calle Al Ahliyyeh, septimo piso.",
    hoursEn: "By appointment",
    hoursAr: "حسب المواعيد",
    hoursEs: "Con cita previa",
    mapsQuery: "Sham Center Al Ahliyyeh Street Ramallah",
    mapsUrl: "https://maps.app.goo.gl/V8F7eVN5NgiFDUJk6",
    walkIn: false,
  },
  {
    nameEn: "Rawabi - Q Center",
    nameAr: "روابي - كيو سنتر",
    nameEs: "Rawabi - Q Center",
    areaEn: "Rawabi, Palestine",
    areaAr: "روابي، فلسطين",
    areaEs: "Rawabi, Palestina",
    addressEn: "Q Center, Rawabi.",
    addressAr: "كيو سنتر، روابي.",
    addressEs: "Q Center, Rawabi.",
    hoursEn: "Walk-in",
    hoursAr: "دخول مباشر",
    hoursEs: "Sin cita",
    mapsQuery: "Q Center Rawabi",
    walkIn: true,
  },
];

function mapsLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function localizedBranchValue(
  locale: "en" | "ar" | "es",
  values: { en: string; ar: string; es: string },
) {
  return locale === "ar" ? values.ar : locale === "es" ? values.es : values.en;
}

export default async function BoutiquesPage() {
  const locale = await getLocaleFromCookies();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
      <section className="rounded-[2rem] border border-[--line] bg-[--panel] px-6 py-10 text-center sm:px-10">
        <p className="text-xs tracking-[0.24em] uppercase text-[--muted]">
          {t(locale, { en: "House Services", ar: "خدمات الدار", es: "Servicios de la casa" })}
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
          {t(locale, { en: "Visit Our Boutiques", ar: "زيارة البوتيكات", es: "Visita nuestras boutiques" })}
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-[--muted]">
          {t(locale, {
            en: "Choose the branch that suits you best and use direct navigation for easy arrival. You can also book a private appointment before your visit.",
            ar: "اختاري الفرع الأنسب لك، واتبعي رابط التنقل للوصول بسهولة. يمكنك أيضًا حجز موعد خاص قبل زيارتك.",
            es: "Elige la sucursal que mejor te convenga y usa la navegacion directa para llegar facilmente. Tambien puedes reservar una cita privada antes de tu visita.",
          })}
        </p>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        {BRANCHES.map((branch) => (
          <article
            key={branch.nameEn}
            className="rounded-[1.5rem] border border-[--line] bg-white p-6 sm:p-7"
          >
            <p className="text-xs tracking-[0.2em] uppercase text-[--muted]">
              {localizedBranchValue(locale, {
                en: branch.areaEn,
                ar: branch.areaAr,
                es: branch.areaEs,
              })}
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[--ink]">
              {localizedBranchValue(locale, {
                en: branch.nameEn,
                ar: branch.nameAr,
                es: branch.nameEs,
              })}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[--muted]">
              {localizedBranchValue(locale, {
                en: branch.addressEn,
                ar: branch.addressAr,
                es: branch.addressEs,
              })}
            </p>

            <div className="mt-6 space-y-2 text-sm text-[--ink]">
              {branch.phone ? <p>{branch.phone}</p> : null}
              <p>
                {localizedBranchValue(locale, {
                  en: branch.hoursEn,
                  ar: branch.hoursAr,
                  es: branch.hoursEs,
                })}
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={branch.mapsUrl ?? mapsLink(branch.mapsQuery)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full bg-[--ink] px-5 py-2 text-[11px] tracking-[0.16em] uppercase text-white"
              >
                {t(locale, { en: "Get Directions", ar: "فتح الملاحة", es: "Como llegar" })}
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full border border-[--line] px-5 py-2 text-[11px] tracking-[0.16em] uppercase text-[--ink]"
              >
                {branch.walkIn
                  ? t(locale, { en: "Contact Us", ar: "تواصلي معنا", es: "Contactanos" })
                  : t(locale, { en: "Book Appointment", ar: "حجز موعد", es: "Reservar cita" })}
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
