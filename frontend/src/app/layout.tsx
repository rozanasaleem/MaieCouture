import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDirection, getLocaleFromCookies } from "@/lib/i18n-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maie Couture",
  description: "Luxury bridal, evening, and ready-to-wear crafted for modern ceremony and occasion dressing.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleFromCookies();
  const direction = getDirection(locale);

  return (
    <html lang={locale} dir={direction}>
      <body className="min-h-screen bg-[--cream] text-[--ink] antialiased">
        <div className="min-h-screen bg-[--cream]">
          <SiteHeader locale={locale} />
          <main>{children}</main>
          <SiteFooter locale={locale} />
        </div>
      </body>
    </html>
  );
}
