import Link from "next/link";
import { getLocaleFromCookies } from "@/lib/i18n-server";

type Branch = {
  nameEn: string;
  nameAr: string;
  areaEn: string;
  areaAr: string;
  addressEn: string;
  addressAr: string;
  phone?: string;
  hoursEn: string;
  hoursAr: string;
  mapsQuery: string;
  mapsUrl?: string;
  walkIn: boolean;
};

const BRANCHES: Branch[] = [
  {
    nameEn: "Ramallah - Al Nijmeh Mall",
    nameAr: "رام الله - النجمة مول",
    areaEn: "Ramallah, Palestine",
    areaAr: "رام الله، فلسطين",
    addressEn: "Al Nijmeh Mall, Irsal Street, 5th Floor.",
    addressAr: "النجمة مول، شارع الإرسال، الطابق الخامس.",
    hoursEn: "By appointment",
    hoursAr: "حسب المواعيد",
    mapsQuery: "Al Nijmeh Mall Irsal Street Ramallah",
    mapsUrl: "https://maps.app.goo.gl/kaDc7vXAPQtBCYHj7",
    walkIn: false,
  },
  {
    nameEn: "Ramallah - Sham Center",
    nameAr: "رام الله - شام سنتر",
    areaEn: "Ramallah, Palestine",
    areaAr: "رام الله، فلسطين",
    addressEn: "Sham Center, Al Ahliyyeh Street, 7th Floor.",
    addressAr: "شام سنتر، شارع الأهلية، الطابق السابع.",
    hoursEn: "By appointment",
    hoursAr: "حسب المواعيد",
    mapsQuery: "Sham Center Al Ahliyyeh Street Ramallah",
    mapsUrl: "https://maps.app.goo.gl/V8F7eVN5NgiFDUJk6",
    walkIn: false,
  },
  {
    nameEn: "Rawabi - Q Center",
    nameAr: "روابي - كيو سنتر",
    areaEn: "Rawabi, Palestine",
    areaAr: "روابي، فلسطين",
    addressEn: "Q Center, Rawabi.",
    addressAr: "كيو سنتر، روابي.",
    hoursEn: "Walk-in",
    hoursAr: "دخول مباشر",
    mapsQuery: "Q Center Rawabi",
    walkIn: true,
  },
];

function mapsLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default async function BoutiquesPage() {
  const locale = await getLocaleFromCookies();
  const isArabic = locale === "ar";

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
      <section className="rounded-[2rem] border border-[--line] bg-[--panel] px-6 py-10 text-center sm:px-10">
        <p className="text-xs tracking-[0.24em] uppercase text-[--muted]">
          {isArabic ? "خدمات الدار" : "House Services"}
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
          {isArabic ? "زيارة البوتيكات" : "Visit Our Boutiques"}
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-[--muted]">
          {isArabic
            ? "اختاري الفرع الأنسب لك، واتبعي رابط التنقل للوصول بسهولة. يمكنك أيضًا حجز موعد خاص قبل زيارتك."
            : "Choose the branch that suits you best and use direct navigation for easy arrival. You can also book a private appointment before your visit."}
        </p>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        {BRANCHES.map((branch) => (
          <article
            key={branch.nameEn}
            className="rounded-[1.5rem] border border-[--line] bg-white p-6 sm:p-7"
          >
            <p className="text-xs tracking-[0.2em] uppercase text-[--muted]">
              {isArabic ? branch.areaAr : branch.areaEn}
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[--ink]">
              {isArabic ? branch.nameAr : branch.nameEn}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[--muted]">
              {isArabic ? branch.addressAr : branch.addressEn}
            </p>

            <div className="mt-6 space-y-2 text-sm text-[--ink]">
              {branch.phone ? <p>{branch.phone}</p> : null}
              <p>{isArabic ? branch.hoursAr : branch.hoursEn}</p>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={branch.mapsUrl ?? mapsLink(branch.mapsQuery)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full bg-[--ink] px-5 py-2 text-[11px] tracking-[0.16em] uppercase text-white"
              >
                {isArabic ? "فتح الملاحة" : "Get Directions"}
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full border border-[--line] px-5 py-2 text-[11px] tracking-[0.16em] uppercase text-[--ink]"
              >
                {branch.walkIn
                  ? isArabic
                    ? "تواصلي معنا"
                    : "Contact Us"
                  : isArabic
                    ? "حجز موعد"
                    : "Book Appointment"}
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
