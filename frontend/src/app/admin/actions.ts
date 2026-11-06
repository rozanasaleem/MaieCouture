"use server";

import { revalidatePath } from "next/cache";
import { adminFetch } from "@/lib/admin-backend";

type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  published: boolean;
  sortOrder: number;
};

type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  fullDescription: string | null;
  price: number | null;
  salePrice: number | null;
  currency: string;
  featured: boolean;
  available: boolean;
  published: boolean;
  mainImage: string | null;
  categoryId: number | null;
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

function nullableString(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? "").trim();
  return stringValue.length > 0 ? stringValue : null;
}

function nullableNumber(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? "").trim();
  if (!stringValue) return null;
  const numberValue = Number(stringValue);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function imageRows(mainImage: string, galleryImages: string) {
  const urls = [mainImage, ...galleryImages.split(/\r?\n/)]
    .map((url) => url.trim())
    .filter(Boolean);

  return Array.from(new Set(urls)).map((imageUrl, index) => ({
    imageUrl,
    sortOrder: index + 1,
    color: null,
  }));
}

export async function createProduct(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const mainImage = String(formData.get("mainImage") ?? "").trim();
  const categoryId = Number(formData.get("categoryId"));
  const currency = String(formData.get("currency") ?? "ILS").trim();
  const purchaseType = String(
    formData.get("purchaseType") ?? "DIRECT_PURCHASE",
  );
  const productStatus = String(formData.get("productStatus") ?? "EVERGREEN");
  const size = nullableString(formData.get("variantSize"));
  const color = nullableString(formData.get("variantColor"));
  const sku = nullableString(formData.get("variantSku"));
  const stockQuantity = Number(formData.get("stockQuantity") ?? 0);

  if (!name || !slug || !mainImage || !categoryId) {
    throw new Error("Name, slug, main image, and category are required.");
  }

  await adminFetch("/admin/products", {
    method: "POST",
    body: JSON.stringify({
      name,
      slug,
      shortDescription: nullableString(formData.get("shortDescription")),
      fullDescription: nullableString(formData.get("fullDescription")),
      price: nullableNumber(formData.get("price")),
      salePrice: nullableNumber(formData.get("salePrice")),
      currency: currency || "ILS",
      mainImage,
      available: formData.get("available") === "on",
      published: formData.get("visibility") === "ACTIVE",
      featured: formData.get("featured") === "on",
      purchaseType,
      productStatus,
      madeToOrder: formData.get("madeToOrder") === "on",
      leadTimeNote: nullableString(formData.get("leadTimeNote")),
      categoryId,
      images: imageRows(mainImage, String(formData.get("galleryImages") ?? "")),
      variants:
        sku || size || color
          ? [
              {
                size,
                color,
                stockQuantity: Number.isFinite(stockQuantity)
                  ? stockQuantity
                  : 0,
                sku: sku ?? `${slug.toUpperCase()}-DEFAULT`,
                madeToOrder: formData.get("madeToOrder") === "on",
              },
            ]
          : [],
    }),
  });

  revalidatePath("/admin");
}

export async function updateOrderStatus(formData: FormData) {
  const id = Number(formData.get("id"));
  const orderStatus = String(formData.get("orderStatus") ?? "").trim();
  const paymentStatus = String(formData.get("paymentStatus") ?? "").trim();
  if (!id || !orderStatus) return;

  await adminFetch(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      orderStatus,
      paymentStatus: paymentStatus || null,
    }),
  });

  revalidatePath("/admin");
}

export async function setCategoryPublished(formData: FormData) {
  const id = Number(formData.get("id"));
  const published = formData.get("published") === "true";
  if (!id) return;

  const categories = await adminFetch<AdminCategory[]>("/admin/categories");
  const current = categories.find((category) => category.id === id);
  if (!current) return;

  await adminFetch(`/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: current.name,
      slug: current.slug,
      description: current.description,
      coverImage: current.coverImage,
      published,
      sortOrder: current.sortOrder,
    }),
  });
  revalidatePath("/admin");
}

export async function setProductPublished(formData: FormData) {
  const id = Number(formData.get("id"));
  const published = formData.get("published") === "true";
  if (!id) return;

  const products = await adminFetch<AdminProduct[]>("/admin/products");
  const current = products.find((product) => product.id === id);
  if (!current) {
    throw new Error(`Product not found: ${id}`);
  }
  if (!current.categoryId) {
    throw new Error(
      `Product ${current.slug} has no categoryId in admin payload. Restart backend and retry.`,
    );
  }

  await adminFetch(`/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: current.name,
      slug: current.slug,
      shortDescription: current.shortDescription,
      fullDescription: current.fullDescription,
      price: current.price,
      salePrice: current.salePrice,
      currency: current.currency,
      mainImage: current.mainImage,
      available: current.available,
      published,
      featured: current.featured,
      purchaseType: current.purchaseType,
      productStatus: current.productStatus,
      madeToOrder: current.madeToOrder,
      leadTimeNote: current.leadTimeNote,
      categoryId: current.categoryId,
      images:
        current.galleryImageDetails?.map((image) => ({
          imageUrl: image.imageUrl,
          sortOrder: image.sortOrder,
          color: image.color,
        })) ??
        (current.galleryImages ?? []).map((imageUrl, index) => ({
          imageUrl,
          sortOrder: index + 1,
          color: null,
        })),
      variants: (current.variants ?? []).map((variant) => ({
        size: variant.size,
        color: variant.color,
        stockQuantity: variant.stockQuantity,
        sku: variant.sku,
        madeToOrder: variant.madeToOrder,
      })),
    }),
  });

  revalidatePath("/admin");
}

export async function setProductAvailable(formData: FormData) {
  const id = Number(formData.get("id"));
  const available = formData.get("available") === "true";
  if (!id) return;

  const products = await adminFetch<AdminProduct[]>("/admin/products");
  const current = products.find((product) => product.id === id);
  if (!current) {
    throw new Error(`Product not found: ${id}`);
  }
  if (!current.categoryId) {
    throw new Error(
      `Product ${current.slug} has no categoryId in admin payload. Restart backend and retry.`,
    );
  }

  await adminFetch(`/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: current.name,
      slug: current.slug,
      shortDescription: current.shortDescription,
      fullDescription: current.fullDescription,
      price: current.price,
      salePrice: current.salePrice,
      currency: current.currency,
      mainImage: current.mainImage,
      available,
      published: current.published,
      featured: current.featured,
      purchaseType: current.purchaseType,
      productStatus: current.productStatus,
      madeToOrder: current.madeToOrder,
      leadTimeNote: current.leadTimeNote,
      categoryId: current.categoryId,
      images:
        current.galleryImageDetails?.map((image) => ({
          imageUrl: image.imageUrl,
          sortOrder: image.sortOrder,
          color: image.color,
        })) ??
        (current.galleryImages ?? []).map((imageUrl, index) => ({
          imageUrl,
          sortOrder: index + 1,
          color: null,
        })),
      variants: (current.variants ?? []).map((variant) => ({
        size: variant.size,
        color: variant.color,
        stockQuantity: variant.stockQuantity,
        sku: variant.sku,
        madeToOrder: variant.madeToOrder,
      })),
    }),
  });

  revalidatePath("/admin");
}

export async function toggleProductArchive(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  const products = await adminFetch<AdminProduct[]>("/admin/products");
  const current = products.find((product) => product.id === id);
  if (!current) {
    throw new Error(`Product not found: ${id}`);
  }
  if (!current.categoryId) {
    throw new Error(
      `Product ${current.slug} has no categoryId in admin payload. Restart backend and retry.`,
    );
  }

  const targetArchived = current.productStatus !== "ARCHIVED";

  await adminFetch(`/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: current.name,
      slug: current.slug,
      shortDescription: current.shortDescription,
      fullDescription: current.fullDescription,
      price: current.price,
      salePrice: current.salePrice,
      currency: current.currency,
      mainImage: current.mainImage,
      available: targetArchived ? false : current.available,
      published: targetArchived ? false : current.published,
      featured: current.featured,
      purchaseType: current.purchaseType,
      productStatus: targetArchived ? "ARCHIVED" : "EVERGREEN",
      madeToOrder: current.madeToOrder,
      leadTimeNote: current.leadTimeNote,
      categoryId: current.categoryId,
      images:
        current.galleryImageDetails?.map((image) => ({
          imageUrl: image.imageUrl,
          sortOrder: image.sortOrder,
          color: image.color,
        })) ??
        (current.galleryImages ?? []).map((imageUrl, index) => ({
          imageUrl,
          sortOrder: index + 1,
          color: null,
        })),
      variants: (current.variants ?? []).map((variant) => ({
        size: variant.size,
        color: variant.color,
        stockQuantity: variant.stockQuantity,
        sku: variant.sku,
        madeToOrder: variant.madeToOrder,
      })),
    }),
  });

  revalidatePath("/admin");
}

export async function updateCustomRequestStatus(formData: FormData) {
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !status) return;

  await adminFetch(`/admin/custom-requests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  revalidatePath("/admin");
}
