"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { submitCustomRequest } from "@/lib/api";
import { getLocaleFromDocument } from "@/lib/i18n-client";
import { t } from "@/lib/i18n-shared";

const requestTypes = [
  { label: "Bridal", arLabel: "عرائس", esLabel: "Novia", value: "BRIDAL" },
  { label: "Couture", arLabel: "كوتور", esLabel: "Couture", value: "COUTURE" },
  { label: "Custom Fitting", arLabel: "تفصيل خاص", esLabel: "Ajuste personalizado", value: "CUSTOM_FITTING" },
  { label: "General Inquiry", arLabel: "استفسار عام", esLabel: "Consulta general", value: "GENERAL_INQUIRY" },
] as const;

const contactMethods = [
  { label: "WhatsApp", arLabel: "واتساب", esLabel: "WhatsApp" },
  { label: "Phone Call", arLabel: "اتصال هاتفي", esLabel: "Llamada telefonica" },
  { label: "Email", arLabel: "البريد الإلكتروني", esLabel: "Correo electronico" },
] as const;

export default function ContactPage() {
  const locale = getLocaleFromDocument();
  const searchParams = useSearchParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCode, setPhoneCode] = useState("+970");
  const [phone, setPhone] = useState("");
  const [requestType, setRequestType] = useState<(typeof requestTypes)[number]["value"]>("BRIDAL");
  const [appointmentType, setAppointmentType] = useState<"VIRTUAL" | "IN_PERSON">("VIRTUAL");
  const [contactMethod, setContactMethod] = useState<(typeof contactMethods)[number]["label"]>("WhatsApp");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasPrefilledFromSearch = useRef(false);

  useEffect(() => {
    if (hasPrefilledFromSearch.current) {
      return;
    }

    const product = searchParams.get("product");
    const option = searchParams.get("option");
    const requestTypeFromUrl = searchParams.get("requestType");

    if (requestTypeFromUrl && requestTypes.some((item) => item.value === requestTypeFromUrl)) {
      setRequestType(requestTypeFromUrl as (typeof requestTypes)[number]["value"]);
    }

    if (product || option) {
      const prefilledLines = [
        product
          ? `${t(locale, {
              en: "Requested piece",
              ar: "القطعة المطلوبة",
              es: "Pieza solicitada",
            })}: ${product}`
          : "",
        option
          ? `${t(locale, {
              en: "Selected option",
              ar: "الخيار المحدد",
              es: "Opcion seleccionada",
            })}: ${option}`
          : "",
      ].filter(Boolean);

      setNotes((current) => {
        if (current.trim()) {
          return current;
        }
        return prefilledLines.join("\n");
      });
    }

    hasPrefilledFromSearch.current = true;
  }, [locale, searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const trimmedPhone = phone.trim();
      const mergedPhone = trimmedPhone
        ? `${phoneCode.trim()} ${trimmedPhone}`.trim()
        : undefined;

      const serviceNote = `Preferred contact: ${contactMethod}`;
      const mergedNotes = notes.trim()
        ? `${serviceNote}\n${notes.trim()}`
        : serviceNote;

      await submitCustomRequest({
        customerName: `${firstName} ${lastName}`.trim(),
        email,
        phone: mergedPhone,
        requestType,
        appointmentType,
        notes: mergedNotes,
        preferredDate: preferredDate ? new Date(preferredDate).toISOString() : undefined,
      });

      setMessage(
        t(locale, {
          en: "Appointment request submitted. We will contact you soon.",
          ar: "تم إرسال طلب الموعد بنجاح. سنتواصل معك قريبًا.",
          es: "Solicitud de cita enviada. Nos pondremos en contacto contigo pronto.",
        }),
      );
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("+970");
      setRequestType("BRIDAL");
      setAppointmentType("VIRTUAL");
      setContactMethod("WhatsApp");
      setPreferredDate("");
      setNotes("");
    } catch (submissionError) {
      const errorMessage =
        submissionError instanceof Error
          ? submissionError.message
          : "Could not submit your request.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <section className="border border-[--line] bg-[--panel] px-6 py-8 text-center sm:px-10">
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
          {t(locale, { en: "Request an Appointment", ar: "طلب موعد", es: "Solicitar una cita" })}
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-[--muted]">
          {t(locale, {
            en: "Whether you would like to visit us in person or connect online, we are here to help you find the right piece for your occasion.",
            ar: "سواء رغبتِ بزيارتنا في البوتيك أو التواصل عبر الإنترنت، نحن هنا لمساعدتك في اختيار القطعة المناسبة لمناسبتك.",
            es: "Ya sea que prefieras visitarnos en la boutique o conectarte en linea, estamos aqui para ayudarte a encontrar la pieza adecuada para tu ocasion.",
          })}
        </p>
      </section>

      <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-4xl space-y-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t(locale, { en: "First Name *", ar: "الاسم الأول *", es: "Nombre *" })}>
            <input
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="w-full border-b border-[--ink]/40 bg-transparent px-0 py-2 text-sm text-[--ink] outline-none focus:border-[--ink]"
            />
          </Field>

          <Field label={t(locale, { en: "Last Name *", ar: "اسم العائلة *", es: "Apellido *" })}>
            <input
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="w-full border-b border-[--ink]/40 bg-transparent px-0 py-2 text-sm text-[--ink] outline-none focus:border-[--ink]"
            />
          </Field>

          <Field label={t(locale, { en: "Email *", ar: "البريد الإلكتروني *", es: "Correo electronico *" })}>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border-b border-[--ink]/40 bg-transparent px-0 py-2 text-sm text-[--ink] outline-none focus:border-[--ink]"
            />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-[0.38fr_0.62fr]">
          <Field label={t(locale, { en: "Code", ar: "المفتاح", es: "Codigo" })}>
            <input
              value={phoneCode}
              onChange={(event) => setPhoneCode(event.target.value)}
              className="w-full border-b border-[--ink]/40 bg-transparent px-0 py-2 text-sm text-[--ink] outline-none focus:border-[--ink]"
            />
          </Field>
          <Field label={t(locale, { en: "Phone", ar: "الهاتف", es: "Telefono" })}>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full border-b border-[--ink]/40 bg-transparent px-0 py-2 text-sm text-[--ink] outline-none focus:border-[--ink]"
            />
          </Field>
        </div>

        <div>
          <p className="text-[11px] tracking-[0.22em] uppercase text-[--muted]">
            {t(locale, { en: "Appointment Type *", ar: "نوع الموعد *", es: "Tipo de cita *" })}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-8 text-sm text-[--ink]">
            <label className="inline-flex items-center gap-3">
              <input
                type="radio"
                checked={appointmentType === "VIRTUAL"}
                onChange={() => setAppointmentType("VIRTUAL")}
              />
              {t(locale, { en: "Virtual", ar: "افتراضي", es: "Virtual" })}
            </label>
            <label className="inline-flex items-center gap-3">
              <input
                type="radio"
                checked={appointmentType === "IN_PERSON"}
                onChange={() => setAppointmentType("IN_PERSON")}
              />
              {t(locale, { en: "In Boutique", ar: "في البوتيك", es: "En boutique" })}
            </label>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={t(locale, { en: "Request Type *", ar: "نوع الطلب *", es: "Tipo de solicitud *" })}>
            <select
              value={requestType}
              onChange={(event) =>
                setRequestType(
                  event.target.value as (typeof requestTypes)[number]["value"],
                )
              }
              className="w-full border-b border-[--ink]/40 bg-transparent px-0 py-2 text-sm text-[--ink] outline-none focus:border-[--ink]"
            >
              {requestTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {locale === "ar" ? option.arLabel : locale === "es" ? option.esLabel : option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label={t(locale, {
              en: "How would you like to be contacted?",
              ar: "كيف تفضلين أن نتواصل معك؟",
              es: "Como te gustaria que nos comunicaramos contigo?",
            })}
          >
            <select
              value={contactMethod}
              onChange={(event) =>
                setContactMethod(event.target.value as (typeof contactMethods)[number]["label"])
              }
              className="w-full border-b border-[--ink]/40 bg-transparent px-0 py-2 text-sm text-[--ink] outline-none focus:border-[--ink]"
            >
              {contactMethods.map((option) => (
                <option key={option.label} value={option.label}>
                  {locale === "ar" ? option.arLabel : locale === "es" ? option.esLabel : option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

          <Field label={t(locale, { en: "Preferred Date (Optional)", ar: "التاريخ المفضل (اختياري)", es: "Fecha preferida (opcional)" })}>
          <input
            type="datetime-local"
            value={preferredDate}
            onChange={(event) => setPreferredDate(event.target.value)}
            className="w-full border-b border-[--ink]/40 bg-transparent px-0 py-2 text-sm text-[--ink] outline-none focus:border-[--ink]"
          />
        </Field>

        <Field label={t(locale, { en: "Service", ar: "الخدمة", es: "Servicio" })}>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t(locale, {
              en: "Share any additional details or questions.",
              ar: "أضيفي أي تفاصيل أو أسئلة إضافية.",
              es: "Comparte cualquier detalle o pregunta adicional.",
            })}
            className="min-h-24 w-full border-b border-[--ink]/40 bg-transparent px-0 py-2 text-sm text-[--ink] outline-none placeholder:text-[--muted]/70 focus:border-[--ink]"
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-[--ink]">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[--ink] px-8 py-3 text-xs tracking-[0.2em] uppercase text-white disabled:opacity-60"
        >
          {loading
            ? t(locale, { en: "Submitting...", ar: "جاري الإرسال...", es: "Enviando..." })
            : t(locale, { en: "Submit", ar: "إرسال", es: "Enviar" })}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <p className="text-[11px] tracking-[0.2em] uppercase text-[--muted]">{label}</p>
      <div className="mt-2">{children}</div>
    </label>
  );
}
