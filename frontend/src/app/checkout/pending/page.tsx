import Link from "next/link";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import { t } from "@/lib/i18n-shared";

export default async function CheckoutPendingPage() {
  const locale = await getLocaleFromCookies();
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-[11px] tracking-[0.24em] uppercase text-[--muted]">
        {t(locale, { en: "Checkout", ar: "الدفع", es: "Pago" })}
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
        {t(locale, { en: "Payment pending", ar: "الدفع قيد الانتظار", es: "Pago pendiente" })}
      </h1>
      <p className="mt-5 text-sm leading-7 text-[--muted]">
        {t(locale, {
          en: "We received your order and are waiting for secure payment confirmation.",
          ar: "تم استلام طلبك وننتظر تأكيد الدفع الآمن.",
          es: "Recibimos tu pedido y estamos esperando la confirmacion segura del pago.",
        })}
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/shop" className="rounded-full bg-[--ink] px-5 py-3 text-xs tracking-[0.2em] uppercase text-white">
          {t(locale, { en: "Back to shop", ar: "العودة للتسوق", es: "Volver a la tienda" })}
        </Link>
        <Link href="/contact" className="rounded-full border border-[--line] px-5 py-3 text-xs tracking-[0.2em] uppercase text-[--ink]">
          {t(locale, { en: "Contact atelier", ar: "تواصل مع الأتيليه", es: "Contactar atelier" })}
        </Link>
      </div>
    </div>
  );
}
