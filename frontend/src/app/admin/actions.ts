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
      images: (current.galleryImages ?? []).map((imageUrl, index) => ({
        imageUrl,
        sortOrder: index + 1,
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
      images: (current.galleryImages ?? []).map((imageUrl, index) => ({
        imageUrl,
        sortOrder: index + 1,
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
      images: (current.galleryImages ?? []).map((imageUrl, index) => ({
        imageUrl,
        sortOrder: index + 1,
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
