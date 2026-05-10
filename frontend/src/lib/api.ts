import {
  Category,
  LahzaInitializeResponse,
  LahzaVerificationResponse,
  OrderResponse,
  ProductDetail,
  ProductSummary,
  ShippingQuote,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";
const HIDDEN_TRIAL_SLUGS = new Set([
  "layal-draped-evening-dress",
  "noor-bridal-corset-dress",
]);

const fallbackCategories: Category[] = [
  {
    id: 1,
    name: "Bridal",
    slug: "bridal",
    description: "Private fittings and made-to-order bridal silhouettes.",
    coverImage: null,
  },
  {
    id: 2,
    name: "Evening Wear",
    slug: "evening-wear",
    description: "Fluid statement pieces for formal celebrations.",
    coverImage: null,
  },
  {
    id: 3,
    name: "Ready-to-Wear",
    slug: "ready-to-wear",
    description: "Day-to-evening pieces designed for immediate purchase.",
    coverImage: null,
  },
];

const fallbackProducts: ProductSummary[] = [];

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Request failed for ${path}`);
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

async function postJson<T, B>(path: string, body: B): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const error = await response.json();
      message = error.message ?? message;
    } catch {
      message = `${message}: ${response.status}`;
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }
  return (await response.json()) as T;
}

export function getCategories() {
  return fetchJson<Category[]>("/public/categories", fallbackCategories);
}

export function getProducts() {
  return fetchJson<ProductSummary[]>("/public/products", fallbackProducts).then((products) =>
    products.filter((product) => !HIDDEN_TRIAL_SLUGS.has(product.slug)),
  );
}

export function getFeaturedProducts() {
  return fetchJson<ProductSummary[]>(
    "/public/products?featured=true",
    fallbackProducts.filter((product) => product.featured),
  ).then((products) => products.filter((product) => !HIDDEN_TRIAL_SLUGS.has(product.slug)));
}

export async function getProduct(slug: string) {
  if (HIDDEN_TRIAL_SLUGS.has(slug)) {
    return null;
  }
  return fetchJson<ProductDetail | null>(
    `/public/products/${slug}`,
    null,
  );
}

export function formatPrice(
  value: number | null,
  currency: string,
  fallback = "Available on request",
) {
  if (value == null) {
    return fallback;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export async function quoteShipping(
  subtotalAmount: number,
  shippingCountryCode: string,
  currency: string,
) {
  return postJson<ShippingQuote, { subtotalAmount: number; shippingCountryCode: string; currency: string }>(
    "/public/shipping/quote",
    {
      subtotalAmount,
      shippingCountryCode,
      currency,
    },
  );
}

export async function createOrder(payload: {
  customerName: string;
  email: string;
  phone?: string;
  shippingAddress: string;
  shippingCountryCode: string;
  notes?: string;
  items: Array<{ productId: number; variantId?: number | null; quantity: number }>;
}) {
  return postJson<OrderResponse, typeof payload>("/public/orders", payload);
}

export async function initializeLahzaPayment(payload: {
  orderId: number;
  returnUrl: string;
  cancelUrl: string;
}) {
  return postJson<LahzaInitializeResponse, typeof payload>(
    "/public/payments/lahza/initialize",
    payload,
  );
}

export async function verifyLahzaPayment(reference: string) {
  const encoded = encodeURIComponent(reference);
  return getJson<LahzaVerificationResponse>(
    `/public/payments/lahza/verify?reference=${encoded}`,
  );
}

export async function submitCustomRequest(payload: {
  customerName: string;
  email: string;
  phone?: string;
  requestType: "BRIDAL" | "COUTURE" | "CUSTOM_FITTING" | "GENERAL_INQUIRY";
  appointmentType?: "VIRTUAL" | "IN_PERSON";
  notes?: string;
  preferredDate?: string;
  productId?: number;
}) {
  return postJson<{ id: number }, typeof payload>("/public/custom-requests", payload);
}
