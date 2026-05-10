"use client";

import { FormEvent, ReactNode, useState } from "react";
import { submitCustomRequest } from "@/lib/api";
import { getLocaleFromDocument } from "@/lib/i18n-client";

const requestTypes = [
  { label: "Bridal", arLabel: "عرائس", value: "BRIDAL" },
  { label: "Couture", arLabel: "كوتور", value: "COUTURE" },
  { label: "Custom Fitting", arLabel: "تفصيل خاص", value: "CUSTOM_FITTING" },
  { label: "General Inquiry", arLabel: "استفسار عام", value: "GENERAL_INQUIRY" },
] as const;

const contactMethods = [
  { label: "WhatsApp", arLabel: "واتساب" },
  { label: "Phone Call", arLabel: "اتصال هاتفي" },
  { label: "Email", arLabel: "البريد الإلكتروني" },
] as const;

export default function ContactPage() {
  const locale = getLocaleFromDocument();
  const isArabic = locale === "ar";
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
        isArabic
          ? "تم إرسال طلب الموعد بنجاح. سنتواصل معك قريبًا."
          : "Appointment request submitted. We will contact you soon.",
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
          {isArabic ? "طلب موعد" : "Request an Appointment"}
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-[--muted]">
          {isArabic
            ? "سواء رغبتِ بزيارتنا في البوتيك أو التواصل عبر الإنترنت، نحن هنا لمساعدتك في اختيار القطعة المناسبة لمناسبتك."
            : "Whether you would like to visit us in person or connect online, we are here to help you find the right piece for your occasion."}
        </p>
      </section>

      <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-4xl space-y-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={isArabic ? "الاسم الأول *" : "First Name *"}>
            <input
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="w-full border-b border-[--ink]/40 bg-transparent px-0 py-2 text-sm text-[--ink] outline-none focus:border-[--ink]"
            />
          </Field>

          <Field label={isArabic ? "اسم العائلة *" : "Last Name *"}>
            <input
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="w-full border-b border-[--ink]/40 bg-transparent px-0 py-2 text-sm text-[--ink] outline-none focus:border-[--ink]"
            />
          </Field>

          <Field label="Email *">
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
          <Field label={isArabic ? "المفتاح" : "Code"}>
            <input
              value={phoneCode}
              onChange={(event) => setPhoneCode(event.target.value)}
              className="w-full border-b border-[--ink]/40 bg-transparent px-0 py-2 text-sm text-[--ink] outline-none focus:border-[--ink]"
            />
          </Field>
          <Field label={isArabic ? "الهاتف" : "Phone"}>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full border-b border-[--ink]/40 bg-transparent px-0 py-2 text-sm text-[--ink] outline-none focus:border-[--ink]"
            />
          </Field>
        </div>

        <div>
          <p className="text-[11px] tracking-[0.22em] uppercase text-[--muted]">
            {isArabic ? "نوع الموعد *" : "Appointment Type *"}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-8 text-sm text-[--ink]">
            <label className="inline-flex items-center gap-3">
              <input
                type="radio"
                checked={appointmentType === "VIRTUAL"}
                onChange={() => setAppointmentType("VIRTUAL")}
              />
              {isArabic ? "افتراضي" : "Virtual"}
            </label>
            <label className="inline-flex items-center gap-3">
              <input
                type="radio"
                checked={appointmentType === "IN_PERSON"}
                onChange={() => setAppointmentType("IN_PERSON")}
              />
              {isArabic ? "في البوتيك" : "In Boutique"}
            </label>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={isArabic ? "نوع الطلب *" : "Request Type *"}>
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
                  {isArabic ? option.arLabel : option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label={
              isArabic ? "كيف تفضلين أن نتواصل معك؟" : "How would you like to be contacted?"
            }
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
                  {isArabic ? option.arLabel : option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

          <Field label={isArabic ? "التاريخ المفضل (اختياري)" : "Preferred Date (Optional)"}>
          <input
            type="datetime-local"
            value={preferredDate}
            onChange={(event) => setPreferredDate(event.target.value)}
            className="w-full border-b border-[--ink]/40 bg-transparent px-0 py-2 text-sm text-[--ink] outline-none focus:border-[--ink]"
          />
        </Field>

        <Field label={isArabic ? "الخدمة" : "Service"}>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={
              isArabic
                ? "أضيفي أي تفاصيل أو أسئلة إضافية."
                : "Share any additional details or questions."
            }
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
            ? isArabic
              ? "جاري الإرسال..."
              : "Submitting..."
            : isArabic
              ? "إرسال"
              : "Submit"}
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
