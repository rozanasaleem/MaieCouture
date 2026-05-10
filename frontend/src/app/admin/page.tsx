import { adminFetch } from "@/lib/admin-backend";
import {
  setCategoryPublished,
  setProductAvailable,
  setProductPublished,
  toggleProductArchive,
  updateCustomRequestStatus,
} from "@/app/admin/actions";

type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  published: boolean;
};

type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  category: string | null;
  published: boolean;
  available: boolean;
  purchaseType: "DIRECT_PURCHASE" | "APPOINTMENT_ONLY" | "INQUIRE_ONLY";
  productStatus: "EVERGREEN" | "LIMITED" | "NEW" | "SOLD_OUT" | "ARCHIVED";
};

type AdminCustomRequest = {
  id: number;
  customerName: string;
  email: string;
  phone: string | null;
  requestType: "BRIDAL" | "COUTURE" | "CUSTOM_FITTING" | "GENERAL_INQUIRY";
  appointmentType: "VIRTUAL" | "IN_PERSON" | null;
  notes: string | null;
  preferredDate: string | null;
  status: "NEW" | "CONTACTED" | "BOOKED" | "COMPLETED" | "CLOSED";
  productId: number | null;
  productName: string | null;
  createdAt: string;
};

const REQUEST_STATUSES: AdminCustomRequest["status"][] = [
  "NEW",
  "CONTACTED",
  "BOOKED",
  "COMPLETED",
  "CLOSED",
];

export default async function AdminPage() {
  const [categories, products, customRequests] = await Promise.all([
    adminFetch<AdminCategory[]>("/admin/categories"),
    adminFetch<AdminProduct[]>("/admin/products"),
    adminFetch<AdminCustomRequest[]>("/admin/custom-requests"),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
      <header className="mb-8">
        <p className="text-xs tracking-[0.24em] uppercase text-[--muted]">
          Admin
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[--ink]">
          Catalog Visibility
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-[--muted]">
          This page is private. Use it to publish/unpublish categories and
          products, and to mark items available/unavailable without Postman.
        </p>
      </header>

      <section className="mb-10 rounded-2xl border border-[--line] bg-white p-5">
        <h2 className="mb-4 text-xs tracking-[0.18em] uppercase text-[--muted]">
          Categories
        </h2>
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[--line] px-4 py-3"
            >
              <div>
                <p className="text-sm text-[--ink]">{category.name}</p>
                <p className="text-xs text-[--muted]">{category.slug}</p>
              </div>
              <form action={setCategoryPublished} className="flex items-center gap-2">
                <input type="hidden" name="id" value={String(category.id)} />
                <input
                  type="hidden"
                  name="published"
                  value={String(!category.published)}
                />
                <button
                  type="submit"
                  className={`rounded-full px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase ${
                    category.published
                      ? "border border-[--line] text-[--ink]"
                      : "bg-[--ink] text-white"
                  }`}
                >
                  {category.published ? "Unpublish" : "Publish"}
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[--line] bg-white p-5">
        <h2 className="mb-4 text-xs tracking-[0.18em] uppercase text-[--muted]">
          Products
        </h2>
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[--line] px-4 py-4 text-sm text-[--muted]">
              No products found in the connected database yet. Import your
              product payload first, then refresh this page.
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[--line] px-4 py-3"
              >
                <div>
                  <p className="text-sm text-[--ink]">{product.name}</p>
                  <p className="text-xs text-[--muted]">
                    {product.slug} · {product.category ?? "No category"} ·{" "}
                    {product.purchaseType} · {product.productStatus}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={setProductPublished}>
                    <input type="hidden" name="id" value={String(product.id)} />
                    <input
                      type="hidden"
                      name="published"
                      value={String(!product.published)}
                    />
                    <button
                      type="submit"
                      className={`rounded-full px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase ${
                        product.published
                          ? "border border-[--line] text-[--ink]"
                          : "bg-[--ink] text-white"
                      }`}
                    >
                      {product.published ? "Unpublish" : "Publish"}
                    </button>
                  </form>

                  <form action={setProductAvailable}>
                    <input type="hidden" name="id" value={String(product.id)} />
                    <input
                      type="hidden"
                      name="available"
                      value={String(!product.available)}
                    />
                    <button
                      type="submit"
                      className={`rounded-full px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase ${
                        product.available
                          ? "border border-[--line] text-[--ink]"
                          : "bg-[--ink] text-white"
                      }`}
                    >
                      {product.available ? "Set unavailable" : "Set available"}
                    </button>
                  </form>
                  <form action={toggleProductArchive}>
                    <input type="hidden" name="id" value={String(product.id)} />
                    <button
                      type="submit"
                      className={`rounded-full px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase ${
                        product.productStatus === "ARCHIVED"
                          ? "border border-[--line] text-[--ink]"
                          : "bg-[--ink] text-white"
                      }`}
                    >
                      {product.productStatus === "ARCHIVED"
                        ? "Unarchive"
                        : "Archive"}
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-[--line] bg-white p-5">
        <h2 className="mb-4 text-xs tracking-[0.18em] uppercase text-[--muted]">
          Appointment Requests
        </h2>
        <div className="space-y-3">
          {customRequests.length === 0 ? (
            <p className="text-sm text-[--muted]">No requests yet.</p>
          ) : (
            customRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[--line] px-4 py-3"
              >
                <div className="max-w-3xl">
                  <p className="text-sm text-[--ink]">
                    #{request.id} · {request.customerName} · {request.requestType}
                    {request.appointmentType ? ` · ${request.appointmentType}` : ""}
                  </p>
                  <p className="text-xs text-[--muted]">
                    {request.email}
                    {request.phone ? ` · ${request.phone}` : ""}
                    {request.productName ? ` · ${request.productName}` : ""}
                  </p>
                  {request.notes ? (
                    <p className="mt-1 text-xs text-[--muted]">
                      {request.notes}
                    </p>
                  ) : null}
                </div>
                <form action={updateCustomRequestStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={String(request.id)} />
                  <select
                    name="status"
                    defaultValue={request.status}
                    className="h-9 rounded-full border border-[--line] bg-white px-3 text-xs tracking-[0.08em] uppercase text-[--ink] outline-none"
                  >
                    {REQUEST_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-full border border-[--line] px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase text-[--ink]"
                  >
                    Update
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
