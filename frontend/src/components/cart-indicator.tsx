"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cartCount, readCart } from "@/lib/cart";

export function CartIndicator({
  locale,
  lightOnDark = false,
}: {
  locale: "en" | "ar";
  lightOnDark?: boolean;
}) {
  const [count, setCount] = useState(0);
  const isArabic = locale === "ar";

  useEffect(() => {
    const sync = () => setCount(cartCount(readCart()));
    sync();
    window.addEventListener("maie-cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("maie-cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <Link
      href="/cart"
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
        lightOnDark
          ? "border-white/60 text-white hover:bg-white/12"
          : "border-[--line] text-[--ink] hover:bg-[--stone]"
      }`}
      aria-label={isArabic ? "السلة" : "Cart"}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
        <path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H7.2" />
      </svg>
      {count > 0 && (
        <span
          className={`absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-[10px] ${
            lightOnDark ? "bg-white text-[#171513]" : "bg-[--ink] text-white"
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
