export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  coverImage: string | null;
};

export type ProductSummary = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string;
  price: number | null;
  salePrice: number | null;
  currency: string;
  featured: boolean;
  mainImage: string | null;
  category: string | null;
  purchaseType: "DIRECT_PURCHASE" | "APPOINTMENT_ONLY" | "INQUIRE_ONLY";
  productStatus: "EVERGREEN" | "LIMITED" | "NEW" | "SOLD_OUT" | "ARCHIVED";
  madeToOrder: boolean;
};

export type ProductDetail = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  price: number | null;
  salePrice: number | null;
  currency: string;
  featured: boolean;
  available: boolean;
  mainImage: string | null;
  category: string | null;
  purchaseType: "DIRECT_PURCHASE" | "APPOINTMENT_ONLY" | "INQUIRE_ONLY";
  productStatus: "EVERGREEN" | "LIMITED" | "NEW" | "SOLD_OUT" | "ARCHIVED";
  madeToOrder: boolean;
  leadTimeNote: string | null;
  galleryImageDetails?: Array<{
    imageUrl: string;
    sortOrder: number;
    color: string | null;
  }>;
  galleryImages: string[];
  variants: Array<{
    id: number;
    size: string | null;
    color: string | null;
    stockQuantity: number;
    sku: string;
    madeToOrder: boolean;
  }>;
};

export type ShippingQuote = {
  shippingCountryCode: string | null;
  shippingAreaCode: string | null;
  subtotalAmount: number;
  shippingFee: number;
  totalAmount: number;
  currency: string;
};

export type OrderResponse = {
  id: number;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string | null;
  shippingAddress: string;
  shippingCountryCode: string | null;
  shippingAreaCode: string | null;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  orderStatus: "PENDING" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";
  subtotalAmount: number;
  shippingFee: number;
  totalAmount: number;
  currency: string;
  paymentReference: string | null;
  createdAt: string;
  items: Array<{
    productId: number;
    variantId: number | null;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export type LahzaInitializeResponse = {
  orderId: number;
  orderNumber: string;
  reference: string;
  checkoutUrl: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
};

export type CyberSourceInitializeResponse = {
  orderId: number;
  orderNumber: string;
  reference: string;
  captureContext: string | null;
  clientLibrary: string | null;
  clientLibraryIntegrity: string | null;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  mock: boolean;
};

export type CyberSourceCompleteResponse = {
  reference: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  orderStatus: "PENDING" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";
  verified: boolean;
};

export type LahzaVerificationResponse = {
  reference: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  orderStatus: "PENDING" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";
  verified: boolean;
};
