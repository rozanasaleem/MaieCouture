"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { completeCyberSourcePayment } from "@/lib/api";
import { clearCart } from "@/lib/cart";

type CyberSourceCheckout = {
  mount: (
    selector:
      | string
      | {
          paymentSelection: string;
          paymentScreen: string;
      },
  ) => Promise<string>;
  destroy?: () => void;
  unmount?: () => void;
};

type CyberSourceClient = {
  createCheckout: (options?: { autoProcessing?: boolean }) => Promise<CyberSourceCheckout>;
  destroy?: () => void;
};

declare global {
  interface Window {
    VAS?: {
      UnifiedCheckout: (captureContext: string) => Promise<CyberSourceClient>;
    };
  }
}

const scriptLoads = new Map<string, Promise<void>>();

function loadScript(src: string, integrity: string) {
  const key = `${src}|${integrity}`;
  const pending = scriptLoads.get(key);
  if (pending) return pending;
  const loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.integrity = integrity;
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoads.delete(key);
      script.remove();
      reject(new Error("CyberSource checkout script could not be loaded."));
    };
    document.head.appendChild(script);
  });
  scriptLoads.set(key, loading);
  return loading;
}

function checkoutErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object") {
    const value = error as Record<string, unknown>;
    const message = [value.message, value.reason, value.status]
      .filter((item): item is string | number => typeof item === "string" || typeof item === "number")
      .map(String)
      .join(" - ");

    if (message) {
      return message;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return "CyberSource returned an unreadable checkout error.";
    }
  }

  return "CyberSource checkout failed.";
}

export default function CyberSourceCheckoutPage() {
  const router = useRouter();
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Preparing secure checkout...");

  useEffect(() => {
    let cancelled = false;
    let client: CyberSourceClient | null = null;
    let checkout: CyberSourceCheckout | null = null;

    async function startCheckout() {
      const captureContext = window.sessionStorage.getItem("maie_cybersource_capture_context");
      const storedReference = window.sessionStorage.getItem("maie_cybersource_reference");
      const clientLibrary = window.sessionStorage.getItem("maie_cybersource_client_library");
      const clientLibraryIntegrity = window.sessionStorage.getItem("maie_cybersource_client_library_integrity");
      setReference(storedReference);

      if (!captureContext || !storedReference || !clientLibrary || !clientLibraryIntegrity) {
        throw new Error("No CyberSource payment session was found. Please return to checkout and try again.");
      }

      setStatus("Loading secure payment form...");
      await loadScript(clientLibrary, clientLibraryIntegrity);
      if (cancelled) return;

      if (!window.VAS?.UnifiedCheckout) {
        throw new Error("CyberSource checkout is unavailable in this browser session.");
      }

      setStatus("Opening secure payment form...");
      client = await window.VAS.UnifiedCheckout(captureContext);
      if (cancelled) {
        client.destroy?.();
        return;
      }
      checkout = await client.createCheckout({ autoProcessing: true });
      if (cancelled) {
        checkout.destroy?.();
        return;
      }
      const resultJwt = await checkout.mount({
        paymentSelection: "#cybersource-payment-buttons",
        paymentScreen: "#cybersource-payment-form",
      });

      if (cancelled) {
        return;
      }

      setStatus("Confirming payment with the atelier...");
      const result = await completeCyberSourcePayment({
        reference: storedReference,
        resultJwt,
      });

      window.sessionStorage.removeItem("maie_cybersource_capture_context");
      window.sessionStorage.removeItem("maie_cybersource_reference");
      window.sessionStorage.removeItem("maie_cybersource_client_library");
      window.sessionStorage.removeItem("maie_cybersource_client_library_integrity");

      if (result.verified) {
        clearCart();
        router.replace(`/checkout/success?provider=cybersource&reference=${encodeURIComponent(result.reference)}`);
        return;
      }

      if (result.paymentStatus === "FAILED") {
        router.replace(`/checkout/failure?reference=${encodeURIComponent(result.reference)}`);
        return;
      }

      router.replace(`/checkout/pending?reference=${encodeURIComponent(result.reference)}`);
    }

    startCheckout().catch((checkoutError) => {
      if (cancelled) {
        return;
      }
      console.error("CyberSource checkout failed", checkoutError);
      setError(`CyberSource checkout failed: ${checkoutErrorMessage(checkoutError)}`);
    });

    return () => {
      cancelled = true;
      checkout?.destroy?.();
      client?.destroy?.();
    };
  }, [router]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-10">
      <p className="text-[11px] tracking-[0.24em] uppercase text-[--muted]">
        Secure payment
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[--ink] sm:text-5xl">
        Complete payment
      </h1>
      <p className="mt-5 max-w-2xl leading-8 text-[--muted]">
        Your order is ready. Please complete payment through the secure CyberSource checkout below.
      </p>
      {reference && (
        <p className="mt-4 text-sm text-[--muted]">
          Payment reference: <span className="text-[--ink]">{reference}</span>
        </p>
      )}

      <section className="mt-8 rounded-[2rem] border border-[--line] bg-[--panel] p-5 sm:p-8">
        <p className="mb-5 text-xs tracking-[0.22em] uppercase text-[--muted]">{status}</p>
        <div id="cybersource-payment-buttons" className="space-y-3" />
        <div id="cybersource-payment-form" className="mt-5" />
        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
            {error}
          </div>
        )}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/checkout"
          className="rounded-full border border-[--line] px-6 py-3 text-xs tracking-[0.2em] uppercase text-[--ink]"
        >
          Back to checkout
        </Link>
        <Link
          href="/contact"
          className="rounded-full bg-[--ink] px-6 py-3 text-xs tracking-[0.2em] uppercase text-white"
        >
          Contact atelier
        </Link>
      </div>
    </main>
  );
}
