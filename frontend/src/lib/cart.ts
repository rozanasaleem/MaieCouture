"use client";

export const CART_STORAGE_KEY = "maie_cart_items";

export type CartItem = {
  productId: number;
  variantId: number | null;
  variantLabel: string | null;
  slug: string;
  name: string;
  image: string | null;
  currency: string;
  unitPrice: number;
  quantity: number;
  purchaseType: "DIRECT_PURCHASE" | "APPOINTMENT_ONLY" | "INQUIRE_ONLY";
};

function isValidCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Partial<CartItem>;
  return (
    typeof item.productId === "number" &&
    (typeof item.variantId === "number" || item.variantId === null || item.variantId === undefined) &&
    (typeof item.variantLabel === "string" || item.variantLabel === null || item.variantLabel === undefined) &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    (typeof item.image === "string" || item.image === null) &&
    typeof item.currency === "string" &&
    typeof item.unitPrice === "number" &&
    typeof item.quantity === "number" &&
    typeof item.purchaseType === "string"
  );
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isValidCartItem).map((item) => ({
      ...item,
      variantId: item.variantId ?? null,
      variantLabel: item.variantLabel ?? null,
    }));
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("maie-cart-updated"));
}

export function addToCart(newItem: CartItem) {
  const items = readCart();
  const existing = items.find(
    (item) =>
      item.productId === newItem.productId &&
      item.variantId === newItem.variantId &&
      item.purchaseType === "DIRECT_PURCHASE",
  );

  if (existing) {
    existing.quantity += newItem.quantity;
    writeCart(items);
    return;
  }

  writeCart([...items, newItem]);
}

export function updateCartQuantity(productId: number, variantId: number | null, quantity: number) {
  const items = readCart();
  const next = items
    .map((item) =>
      item.productId === productId && item.variantId === variantId
        ? { ...item, quantity: Math.max(1, quantity) }
        : item,
    )
    .filter((item) => item.quantity > 0);
  writeCart(next);
}

export function removeFromCart(productId: number, variantId: number | null) {
  const items = readCart().filter(
    (item) => !(item.productId === productId && item.variantId === variantId),
  );
  writeCart(items);
}

export function clearCart() {
  writeCart([]);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function cartBaseCurrency(items: CartItem[]): string {
  if (items.length === 0) {
    return "USD";
  }

  const normalized = items
    .map((item) => (item.currency || "").trim().toUpperCase())
    .filter(Boolean)
    .map((code) => (code === "NIS" ? "ILS" : code));

  if (normalized.length === 0) {
    return "USD";
  }

  const first = normalized[0];
  const allSame = normalized.every((code) => code === first);
  return allSame ? first : "USD";
}
