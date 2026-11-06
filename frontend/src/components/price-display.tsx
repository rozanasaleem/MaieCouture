"use client";

import { useEffect, useState } from "react";
import { formatMoney, toDisplayMoney } from "@/lib/currency-client";

type PriceDisplayProps = {
  amount: number | null;
  currency: string;
  fallback?: string;
  showEstimateLabel?: boolean;
};

export function PriceDisplay({
  amount,
  currency,
  fallback = "Available on request",
  showEstimateLabel = false,
}: PriceDisplayProps) {
  const [, setVersion] = useState(0);

  useEffect(() => {
    const sync = () => setVersion((current) => current + 1);
    window.addEventListener("maie-currency-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("maie-currency-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (amount == null) {
    return <>{fallback}</>;
  }

  const display = toDisplayMoney(amount, currency);
  const formatted = formatMoney(display.amount, display.currency);

  if (!showEstimateLabel || !display.estimated) {
    return <>{formatted}</>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span>{formatted}</span>
      <span className="text-[10px] tracking-[0.16em] uppercase text-[--muted]">
        est.
      </span>
    </span>
  );
}
