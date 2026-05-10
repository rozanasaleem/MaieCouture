import Link from "next/link";
import { verifyLahzaPayment } from "@/lib/api";
import { getLocaleFromCookies } from "@/lib/i18n-server";

type SuccessSearchParams = Promise<{ reference?: string }>;

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SuccessSearchParams;
}) {
  const locale = await getLocaleFromCookies();
  const isArabic = locale === "ar";
  const { reference } = await searchParams;

  let statusMessage = isArabic
    ? "تعذر التحقق من الدفع الآن. سيقوم فريقنا بالتأكيد قريبًا."
    : "Unable to verify payment right now. Our team will confirm shortly.";
  if (reference) {
    try {
      const result = await verifyLahzaPayment(reference);
      statusMessage = result.verified
        ? isArabic
          ? "تم التحقق من الدفع. طلبك الآن قيد المعالجة."
          : "Payment verified. Your order is now processing."
        : isArabic
          ? "تم استلام الدفع لكن لم يكتمل التحقق بعد."
          : "Payment received but not yet verified.";
    } catch {
      statusMessage = isArabic
        ? "تعذر التحقق من الدفع الآن. سيقوم فريقنا بالتأكيد قريبًا."
        : "Unable to verify payment right now. Our team will confirm shortly.";
    }
  } else {
    statusMessage = isArabic ? "مرجع الدفع غير موجود." : "Missing payment reference.";
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-[11px] tracking-[0.24em] uppercase text-[--muted]">
        {isArabic ? "الدفع" : "Checkout"}
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
        {isArabic ? "نجاح الدفع" : "Payment success"}
      </h1>
      <p className="mt-5 text-sm leading-7 text-[--muted]">{statusMessage}</p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/shop"
          className="rounded-full bg-[--ink] px-5 py-3 text-xs tracking-[0.2em] uppercase text-white"
        >
          {isArabic ? "متابعة التسوق" : "Continue shopping"}
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-[--line] px-5 py-3 text-xs tracking-[0.2em] uppercase text-[--ink]"
        >
          {isArabic ? "تواصل مع الأتيليه" : "Contact atelier"}
        </Link>
      </div>
    </div>
  );
}
