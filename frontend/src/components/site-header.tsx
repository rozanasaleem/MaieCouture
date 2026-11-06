"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CountrySelector } from "@/components/country-selector";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CurrencySelector } from "@/components/currency-selector";
import { CartIndicator } from "@/components/cart-indicator";
import { Locale, t } from "@/lib/i18n-shared";

type NavItem = {
  label: string;
  href: string;
};

type NavSection = {
  label: string;
  href?: string;
  items?: NavItem[];
};

function navSectionsFor(locale: Locale): NavSection[] {
  return [
    {
      label: t(locale, { en: "Discover", ar: "اكتشف", es: "Descubrir" }),
      items: [
        {
          label: t(locale, { en: "Bridal Gowns", ar: "فساتين الزفاف", es: "Vestidos de novia" }),
          href: `/shop?category=bridal&label=${encodeURIComponent(t(locale, { en: "Bridal Gowns", ar: "فساتين الزفاف", es: "Vestidos de novia" }))}&subtype=${encodeURIComponent("bridal-gowns")}`,
        },
        {
          label: t(locale, { en: "Katb Ktab & Jaha Dresses", ar: "كتب كتاب وجاهة", es: "Vestidos Katb Ktab y Jaha" }),
          href: `/shop?category=bridal&label=${encodeURIComponent(t(locale, { en: "Katb Ktab & Jaha Dresses", ar: "كتب كتاب وجاهة", es: "Vestidos Katb Ktab y Jaha" }))}&subtype=${encodeURIComponent("katb-ktab")}`,
        },
        {
          label: t(locale, { en: "Henna Dresses", ar: "فساتين حنة", es: "Vestidos de henna" }),
          href: `/shop?category=bridal&label=${encodeURIComponent(t(locale, { en: "Henna Dresses", ar: "فساتين حنة", es: "Vestidos de henna" }))}&subtype=${encodeURIComponent("henna-dresses")}`,
        },
        {
          label: t(locale, { en: "Evening Wear", ar: "ملابس السهرة", es: "Ropa de noche" }),
          href: `/shop?category=evening-wear&label=${encodeURIComponent(t(locale, { en: "Evening Wear", ar: "ملابس السهرة", es: "Ropa de noche" }))}`,
        },
        {
          label: t(locale, { en: "Traditional Wear", ar: "الزي التقليدي", es: "Ropa tradicional" }),
          href: `/shop?category=traditional-wear&label=${encodeURIComponent(t(locale, { en: "Traditional Wear", ar: "الزي التقليدي", es: "Ropa tradicional" }))}`,
        },
      ],
    },
    {
      label: t(locale, { en: "Shop", ar: "تسوق", es: "Comprar" }),
      items: [
        {
          label: t(locale, { en: "Ready to Wear", ar: "جاهز للارتداء", es: "Listo para usar" }),
          href: `/shop?category=ready-to-wear&label=${encodeURIComponent(
            t(locale, { en: "Ready to Wear", ar: "جاهز للارتداء", es: "Listo para usar" }),
          )}`,
        },
        {
          label: t(locale, { en: "Accessories", ar: "الإكسسوارات", es: "Accesorios" }),
          href: `/shop?category=accessories&label=${encodeURIComponent(
            t(locale, { en: "Accessories", ar: "الإكسسوارات", es: "Accesorios" }),
          )}`,
        },
        {
          label: t(locale, { en: "Home", ar: "المنزل", es: "Hogar" }),
          href: `/shop?category=home&label=${encodeURIComponent(
            t(locale, { en: "Home", ar: "المنزل", es: "Hogar" }),
          )}`,
        },
      ],
    },
    { label: t(locale, { en: "About", ar: "عن الدار", es: "Sobre la casa" }), href: "/about" },
    { label: t(locale, { en: "Contact", ar: "تواصل", es: "Contacto" }), href: "/contact" },
  ];
}

export function SiteHeader({ locale }: { locale: Locale }) {
  const navSections = navSectionsFor(locale);
  const pathname = usePathname();
  const isHomePath = pathname === "/";
  const homeToneClass = isHomePath ? "text-white" : "text-[--ink]";

  return (
    <header
      className={`top-0 z-40 ${
        isHomePath
          ? "fixed inset-x-0 border-transparent bg-transparent"
          : "sticky border-b border-[--line] bg-[rgba(249,248,245,0.95)] backdrop-blur"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:gap-6 lg:px-10">
        <div className="flex shrink-0 items-center gap-2 lg:min-w-[11rem] lg:gap-4">
          <div className="hidden lg:flex lg:flex-col lg:items-start lg:gap-2">
            <div
              className={`pointer-events-auto flex items-center gap-2 ${
                isHomePath ? "px-1.5 py-0.5" : ""
              }`}
            >
            <CountrySelector subtle locale={locale} lightOnDark={isHomePath} />
            <LanguageSwitcher locale={locale} lightOnDark={isHomePath} />
            <CurrencySelector subtle locale={locale} lightOnDark={isHomePath} />
            </div>
            <Link href="/" className="flex items-center">
              <Image
                src="/maie-logo-black.png"
                alt="Maie Couture"
                width={164}
                height={58}
                priority
                className={`h-auto w-[88px] sm:w-[96px] md:w-[112px] lg:w-[124px] ${
                  isHomePath ? "brightness-0 invert" : ""
                }`}
              />
            </Link>
          </div>
          <Link href="/" className="flex items-center lg:hidden">
            <Image
              src="/maie-logo-black.png"
              alt="Maie Couture"
              width={164}
              height={58}
              priority
              className={`h-auto w-[88px] sm:w-[96px] md:w-[112px] lg:w-[124px] ${
                isHomePath ? "brightness-0 invert" : ""
              }`}
            />
          </Link>
        </div>

        <nav className={`hidden items-center gap-7 text-[11px] tracking-[0.14em] lg:flex ${homeToneClass}`}>
          {navSections.map((section) =>
            section.items ? (
              <div key={section.label} className="group relative">
                <button className="cursor-default transition-colors hover:opacity-80">
                  {section.label}
                </button>
                <div className="pointer-events-none absolute left-1/2 top-full z-40 hidden -translate-x-1/2 pt-4 group-hover:block group-hover:pointer-events-auto">
                  <div className="min-w-56 rounded-xl border border-[rgba(23,21,19,0.35)] bg-white p-2 text-[#171513] shadow-[0_22px_54px_rgba(10,8,6,0.2)]">
                    {section.items.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="block rounded-lg px-4 py-3 text-[11px] leading-5 tracking-[0.08em] text-[#171513] transition hover:bg-[--stone]"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={section.label}
                href={section.href ?? "/"}
                className="transition-colors hover:text-[--ink]"
              >
                {section.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <SearchPopover locale={locale} lightOnDark={isHomePath} />
          <CartIndicator locale={locale} lightOnDark={isHomePath} />
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <CartIndicator locale={locale} lightOnDark={isHomePath} />
          <details className="group relative">
            <summary
              className={`inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border transition [&::-webkit-details-marker]:hidden ${
                isHomePath
                  ? "border-white/60 text-white hover:bg-white/12"
                  : "border-[--line] text-[--ink] hover:bg-[--stone]"
              }`}
              aria-label={t(locale, { en: "Menu", ar: "القائمة", es: "Menu" })}
            >
              <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </summary>
            <div className="absolute right-0 top-full z-50 mt-3 w-[min(20rem,calc(100vw-1.25rem))] rounded-xl border border-[--line] bg-white p-3 shadow-[0_18px_48px_rgba(32,25,21,0.12)]">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[--line] px-4 py-3">
                  <CountrySelector subtle locale={locale} />
                  <LanguageSwitcher locale={locale} />
                  <CurrencySelector subtle locale={locale} />
                </div>
                <MobileSearchForm locale={locale} />
                {navSections.map((section) =>
                  section.items ? (
                    <details key={section.label} className="rounded-xl border border-[--line] px-4 py-3">
                      <summary className="cursor-pointer list-none text-[11px] tracking-[0.08em] text-[--ink]">
                        {section.label}
                      </summary>
                      <div className="mt-3 grid gap-1">
                        {section.items.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="rounded-lg px-2 py-2 text-sm text-[--ink] transition hover:bg-[--stone]"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </details>
                  ) : (
                    <Link
                      key={section.label}
                      href={section.href ?? "/"}
                      className="block rounded-xl border border-[--line] px-4 py-4 text-[11px] tracking-[0.08em] text-[--ink]"
                    >
                      {section.label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

function SearchPopover({
  locale,
  lightOnDark = false,
}: {
  locale: Locale;
  lightOnDark?: boolean;
}) {
  return (
    <details className="group relative">
      <summary
        className={`inline-flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-full border transition [&::-webkit-details-marker]:hidden ${
          lightOnDark
            ? "border-white/60 text-white hover:bg-white/12"
            : "border-[--line] text-[--ink] hover:bg-[--stone]"
        }`}
        aria-label={t(locale, { en: "Search", ar: "بحث", es: "Buscar" })}
      >
        <span className="text-xs">⌕</span>
      </summary>
      <div className="absolute right-0 top-full z-50 mt-3 w-72 rounded-xl border border-[--line] bg-[--panel] p-3 shadow-[0_14px_34px_rgba(20,16,12,0.12)]">
        <form action="/shop" method="get" className="flex items-center gap-2">
          <input
            name="q"
            type="search"
            placeholder={t(locale, {
              en: "Search pieces",
              ar: "ابحثي عن قطعة",
              es: "Buscar piezas",
            })}
            className="h-9 w-full rounded-full border border-[--line] bg-white px-4 text-sm text-[--ink] outline-none placeholder:text-[--muted] focus:border-[--ink]"
          />
          <button
            type="submit"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[--line] text-[--ink] transition hover:bg-[--stone]"
            aria-label={t(locale, { en: "Search", ar: "بحث", es: "Buscar" })}
          >
            <span className="text-sm">⌕</span>
          </button>
        </form>
      </div>
    </details>
  );
}

function MobileSearchForm({ locale }: { locale: Locale }) {
  return (
    <form action="/shop" method="get" className="flex items-center gap-2 rounded-xl border border-[--line] p-2">
      <input
        name="q"
        type="search"
        placeholder={t(locale, {
          en: "Search pieces",
          ar: "ابحثي عن قطعة",
          es: "Buscar piezas",
        })}
        className="h-9 w-full rounded-full border border-[--line] bg-white px-4 text-sm text-[--ink] outline-none placeholder:text-[--muted] focus:border-[--ink]"
      />
      <button
        type="submit"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[--line] text-[--ink] transition hover:bg-[--stone]"
        aria-label={t(locale, { en: "Search", ar: "بحث", es: "Buscar" })}
      >
        <span className="text-sm">⌕</span>
      </button>
    </form>
  );
}
