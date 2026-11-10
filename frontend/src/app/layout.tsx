import type { Metadata } from "next";
import { headers } from "next/headers";
import { StorePreferences } from "@/components/store-preferences";
import { DEFAULT_COUNTRY, normalizeCountryCode } from "@/lib/country-shared";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDirection, getLocaleFromCookies } from "@/lib/i18n-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maie Couture",
  description: "Luxury bridal, evening, and ready-to-wear crafted for modern ceremony and occasion dressing.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleFromCookies();
  const direction = getDirection(locale);
  const country = normalizeCountryCode((await headers()).get("x-vercel-ip-country")) ?? DEFAULT_COUNTRY;

  return (
    <html lang={locale} dir={direction} data-country={country}>
      <body className="min-h-screen bg-[--cream] text-[--ink] antialiased">
        <StorePreferences country={country}>
          <div className="min-h-screen bg-[--cream]">
            <SiteHeader locale={locale} />
            <main>{children}</main>
            <SiteFooter locale={locale} />
          </div>
        </StorePreferences>
      </body>
    </html>
  );
}
