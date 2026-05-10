import Link from "next/link";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function CheckoutPendingPage() {
  const locale = await getLocaleFromCookies();
  const isArabic = locale === "ar";
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-[11px] tracking-[0.24em] uppercase text-[--muted]">
        {isArabic ? "الدفع" : "Checkout"}
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
        {isArabic ? "الدفع قيد الانتظار" : "Payment pending"}
      </h1>
      <p className="mt-5 text-sm leading-7 text-[--muted]">
        {isArabic
          ? "تم استلام طلبك وننتظر تأكيد الدفع من لحظة."
          : "We received your order and are waiting for payment confirmation from Lahza."}
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/shop" className="rounded-full bg-[--ink] px-5 py-3 text-xs tracking-[0.2em] uppercase text-white">
          {isArabic ? "العودة للتسوق" : "Back to shop"}
        </Link>
        <Link href="/contact" className="rounded-full border border-[--line] px-5 py-3 text-xs tracking-[0.2em] uppercase text-[--ink]">
          {isArabic ? "تواصل مع الأتيليه" : "Contact atelier"}
        </Link>
      </div>
    </div>
  );
}
