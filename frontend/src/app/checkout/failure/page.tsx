import Link from "next/link";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import { t } from "@/lib/i18n-shared";

export default async function CheckoutFailurePage() {
  const locale = await getLocaleFromCookies();
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-[11px] tracking-[0.24em] uppercase text-[--muted]">
        {t(locale, { en: "Checkout", ar: "الدفع", es: "Pago" })}
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
        {t(locale, { en: "Payment was not completed", ar: "لم يكتمل الدفع", es: "El pago no se completo" })}
      </h1>
      <p className="mt-5 text-sm leading-7 text-[--muted]">
        {t(locale, {
          en: "No worries. You can try payment again or contact us directly if you need help completing your order.",
          ar: "لا مشكلة. يمكنك محاولة الدفع مرة أخرى أو التواصل معنا مباشرة إذا احتجتِ مساعدة لإكمال طلبك.",
          es: "No te preocupes. Puedes intentar el pago de nuevo o contactarnos directamente si necesitas ayuda para completar tu pedido.",
        })}
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/checkout" className="rounded-full bg-[--ink] px-5 py-3 text-xs tracking-[0.2em] uppercase text-white">
          {t(locale, { en: "Try again", ar: "حاولي مرة أخرى", es: "Intentar de nuevo" })}
        </Link>
        <Link href="/contact" className="rounded-full border border-[--line] px-5 py-3 text-xs tracking-[0.2em] uppercase text-[--ink]">
          {t(locale, { en: "Contact atelier", ar: "تواصل مع الأتيليه", es: "Contactar atelier" })}
        </Link>
      </div>
    </div>
  );
}
