import Link from "next/link";
import { getCyberSourcePaymentStatus, verifyLahzaPayment } from "@/lib/api";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import { t } from "@/lib/i18n-shared";

type SuccessSearchParams = Promise<{ reference?: string; provider?: string }>;

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SuccessSearchParams;
}) {
  const locale = await getLocaleFromCookies();
  const { reference, provider } = await searchParams;

  let statusMessage = t(locale, {
    en: "Unable to verify payment right now. Our team will confirm shortly.",
    ar: "تعذر التحقق من الدفع الآن. سيقوم فريقنا بالتأكيد قريبًا.",
    es: "No podemos verificar el pago ahora mismo. Nuestro equipo lo confirmara pronto.",
  });
  if (reference) {
    try {
      const result = provider === "cybersource"
        ? await getCyberSourcePaymentStatus(reference)
        : await verifyLahzaPayment(reference);
      statusMessage = result.verified
        ? t(locale, {
            en: "Payment verified. Your order is now processing.",
            ar: "تم التحقق من الدفع. طلبك الآن قيد المعالجة.",
            es: "Pago verificado. Tu pedido ya esta en proceso.",
          })
        : t(locale, {
            en: "Payment received but not yet verified.",
            ar: "تم استلام الدفع لكن لم يكتمل التحقق بعد.",
            es: "Pago recibido, pero aun no ha sido verificado.",
          });
    } catch {
      statusMessage = t(locale, {
        en: "Unable to verify payment right now. Our team will confirm shortly.",
        ar: "تعذر التحقق من الدفع الآن. سيقوم فريقنا بالتأكيد قريبًا.",
        es: "No podemos verificar el pago ahora mismo. Nuestro equipo lo confirmara pronto.",
      });
    }
  } else {
    statusMessage = t(locale, {
      en: "Missing payment reference.",
      ar: "مرجع الدفع غير موجود.",
      es: "Falta la referencia del pago.",
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-[11px] tracking-[0.24em] uppercase text-[--muted]">
        {t(locale, { en: "Checkout", ar: "الدفع", es: "Pago" })}
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
        {t(locale, { en: "Payment success", ar: "نجاح الدفع", es: "Pago exitoso" })}
      </h1>
      <p className="mt-5 text-sm leading-7 text-[--muted]">{statusMessage}</p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/shop"
          className="rounded-full bg-[--ink] px-5 py-3 text-xs tracking-[0.2em] uppercase text-white"
        >
          {t(locale, { en: "Continue shopping", ar: "متابعة التسوق", es: "Seguir comprando" })}
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-[--line] px-5 py-3 text-xs tracking-[0.2em] uppercase text-[--ink]"
        >
          {t(locale, { en: "Contact atelier", ar: "تواصل مع الأتيليه", es: "Contactar atelier" })}
        </Link>
      </div>
    </div>
  );
}
