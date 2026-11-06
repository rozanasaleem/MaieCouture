import { adminFetch } from "@/lib/admin-backend";
import {
  createProduct,
  setCategoryPublished,
  setProductAvailable,
  setProductPublished,
  toggleProductArchive,
  updateCustomRequestStatus,
  updateOrderStatus,
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

type AdminOrder = {
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

const ORDER_STATUSES: AdminOrder["orderStatus"][] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

const PAYMENT_STATUSES: AdminOrder["paymentStatus"][] = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

const PURCHASE_TYPES: AdminProduct["purchaseType"][] = [
  "DIRECT_PURCHASE",
  "APPOINTMENT_ONLY",
  "INQUIRE_ONLY",
];

const PRODUCT_STATUSES: AdminProduct["productStatus"][] = [
  "EVERGREEN",
  "LIMITED",
  "NEW",
  "SOLD_OUT",
  "ARCHIVED",
];

function formatMoney(amount: number | null | undefined, currency: string) {
  if (amount == null) return "No price";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminPage() {
  const [categories, products, customRequests, orders] = await Promise.all([
    adminFetch<AdminCategory[]>("/admin/categories"),
    adminFetch<AdminProduct[]>("/admin/products"),
    adminFetch<AdminCustomRequest[]>("/admin/custom-requests"),
    adminFetch<AdminOrder[]>("/admin/orders"),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
      <header className="mb-8">
        <p className="text-xs tracking-[0.24em] uppercase text-[--muted]">
          Admin
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[--ink]">
          Atelier Dashboard
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-[--muted]">
          Manage products, visibility, orders, and appointment requests from one
          private workspace. Image upload storage will come later; for now, use
          image links from your hosted product media.
        </p>
      </header>

      <section className="mb-10 rounded-2xl border border-[--line] bg-white p-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xs tracking-[0.18em] uppercase text-[--muted]">
              Add a Piece
            </h2>
            <p className="mt-2 text-sm text-[--muted]">
              Create active or draft products with pricing, availability, media
              links, category, and a starter variant.
            </p>
          </div>
          <span className="rounded-full border border-[--line] px-3 py-1 text-[10px] tracking-[0.14em] uppercase text-[--muted]">
            MVP product editor
          </span>
        </div>

        <form action={createProduct} className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
              Product name *
              <input
                required
                name="name"
                className="mt-2 h-11 w-full rounded-xl border border-[--line] bg-white px-3 text-sm normal-case tracking-normal text-[--ink] outline-none"
                placeholder="Floral Ember Thobe"
              />
            </label>
            <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
              URL slug *
              <input
                required
                name="slug"
                className="mt-2 h-11 w-full rounded-xl border border-[--line] bg-white px-3 text-sm normal-case tracking-normal text-[--ink] outline-none"
                placeholder="floral-ember-thobe"
              />
            </label>
            <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
              Short description
              <input
                name="shortDescription"
                className="mt-2 h-11 w-full rounded-xl border border-[--line] bg-white px-3 text-sm normal-case tracking-normal text-[--ink] outline-none"
                placeholder="A refined ready-to-wear piece with hand-finished details."
              />
            </label>
            <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
              Detailed description
              <textarea
                name="fullDescription"
                rows={6}
                className="mt-2 w-full rounded-xl border border-[--line] bg-white px-3 py-3 text-sm normal-case tracking-normal text-[--ink] outline-none"
                placeholder="Describe the fabric, craftsmanship, fit, and story of the piece."
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
                Price
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-2 h-11 w-full rounded-xl border border-[--line] bg-white px-3 text-sm normal-case tracking-normal text-[--ink] outline-none"
                  placeholder="1800"
                />
              </label>
              <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
                Sale price
                <input
                  name="salePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-2 h-11 w-full rounded-xl border border-[--line] bg-white px-3 text-sm normal-case tracking-normal text-[--ink] outline-none"
                />
              </label>
              <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
                Currency
                <select
                  name="currency"
                  defaultValue="ILS"
                  className="mt-2 h-11 w-full rounded-xl border border-[--line] bg-white px-3 text-sm text-[--ink] outline-none"
                >
                  <option value="ILS">ILS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="JOD">JOD</option>
                </select>
              </label>
            </div>

            <div className="rounded-xl border border-dashed border-[--line] p-3 text-xs text-[--muted]">
              Bulk discounts are not active yet. We should add them as a proper
              discount/pricing table before they affect checkout totals.
            </div>

            <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
              Main image URL *
              <input
                required
                name="mainImage"
                className="mt-2 h-11 w-full rounded-xl border border-[--line] bg-white px-3 text-sm normal-case tracking-normal text-[--ink] outline-none"
                placeholder="/products/example.jpg or https://..."
              />
            </label>
            <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
              Gallery image URLs
              <textarea
                name="galleryImages"
                rows={4}
                className="mt-2 w-full rounded-xl border border-[--line] bg-white px-3 py-3 text-sm normal-case tracking-normal text-[--ink] outline-none"
                placeholder="One image URL per line"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
                Category *
                <select
                  required
                  name="categoryId"
                  className="mt-2 h-11 w-full rounded-xl border border-[--line] bg-white px-3 text-sm text-[--ink] outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
                Visibility
                <select
                  name="visibility"
                  defaultValue="DRAFT"
                  className="mt-2 h-11 w-full rounded-xl border border-[--line] bg-white px-3 text-sm text-[--ink] outline-none"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                </select>
              </label>
              <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
                Purchase type
                <select
                  name="purchaseType"
                  defaultValue="DIRECT_PURCHASE"
                  className="mt-2 h-11 w-full rounded-xl border border-[--line] bg-white px-3 text-sm text-[--ink] outline-none"
                >
                  {PURCHASE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
                Product status
                <select
                  name="productStatus"
                  defaultValue="EVERGREEN"
                  className="mt-2 h-11 w-full rounded-xl border border-[--line] bg-white px-3 text-sm text-[--ink] outline-none"
                >
                  {PRODUCT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2 rounded-xl border border-[--line] px-3 py-3 text-xs tracking-[0.1em] uppercase text-[--muted]">
                <input name="available" type="checkbox" defaultChecked />
                Available
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-[--line] px-3 py-3 text-xs tracking-[0.1em] uppercase text-[--muted]">
                <input name="madeToOrder" type="checkbox" />
                Made to order
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-[--line] px-3 py-3 text-xs tracking-[0.1em] uppercase text-[--muted]">
                <input name="featured" type="checkbox" />
                Featured
              </label>
            </div>
            <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
              Lead time note
              <input
                name="leadTimeNote"
                className="mt-2 h-11 w-full rounded-xl border border-[--line] bg-white px-3 text-sm normal-case tracking-normal text-[--ink] outline-none"
                placeholder="Usually ready within 2 weeks."
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
                Starter size
                <input
                  name="variantSize"
                  className="mt-2 h-11 w-full rounded-xl border border-[--line] bg-white px-3 text-sm normal-case tracking-normal text-[--ink] outline-none"
                  placeholder="XS, S, M, Custom"
                />
              </label>
              <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
                Starter color
                <input
                  name="variantColor"
                  className="mt-2 h-11 w-full rounded-xl border border-[--line] bg-white px-3 text-sm normal-case tracking-normal text-[--ink] outline-none"
                  placeholder="Ivory"
                />
              </label>
              <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
                Starter SKU
                <input
                  name="variantSku"
                  className="mt-2 h-11 w-full rounded-xl border border-[--line] bg-white px-3 text-sm normal-case tracking-normal text-[--ink] outline-none"
                  placeholder="MC-RTW-001-S-IV"
                />
              </label>
              <label className="block text-xs tracking-[0.12em] uppercase text-[--muted]">
                Stock quantity
                <input
                  name="stockQuantity"
                  type="number"
                  min="0"
                  defaultValue="0"
                  className="mt-2 h-11 w-full rounded-xl border border-[--line] bg-white px-3 text-sm normal-case tracking-normal text-[--ink] outline-none"
                />
              </label>
            </div>
            <button
              type="submit"
              className="h-11 rounded-full bg-[--ink] px-6 text-xs tracking-[0.18em] uppercase text-white"
            >
              Add piece
            </button>
          </div>
        </form>
      </section>

      <section className="mb-10 rounded-2xl border border-[--line] bg-white p-5">
        <h2 className="mb-4 text-xs tracking-[0.18em] uppercase text-[--muted]">
          Orders
        </h2>
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-sm text-[--muted]">No orders yet.</p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-[--line] px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-[--ink]">
                      {order.orderNumber} · {order.customerName}
                    </p>
                    <p className="mt-1 text-xs text-[--muted]">
                      {order.email}
                      {order.phone ? ` · ${order.phone}` : ""} ·{" "}
                      {formatDate(order.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-[--muted]">
                      {order.shippingAddress} ·{" "}
                      {order.shippingCountryCode ?? "No country"}
                      {order.shippingAreaCode
                        ? ` · ${order.shippingAreaCode}`
                        : ""}
                    </p>
                    <p className="mt-2 text-sm text-[--ink]">
                      {formatMoney(order.totalAmount, order.currency)}
                      <span className="text-xs text-[--muted]">
                        {" "}
                        including {formatMoney(order.shippingFee, order.currency)}{" "}
                        shipping
                      </span>
                    </p>
                  </div>

                  <form action={updateOrderStatus} className="flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={String(order.id)} />
                    <select
                      name="orderStatus"
                      defaultValue={order.orderStatus}
                      className="h-9 rounded-full border border-[--line] bg-white px-3 text-xs tracking-[0.08em] uppercase text-[--ink] outline-none"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <select
                      name="paymentStatus"
                      defaultValue={order.paymentStatus}
                      className="h-9 rounded-full border border-[--line] bg-white px-3 text-xs tracking-[0.08em] uppercase text-[--ink] outline-none"
                    >
                      {PAYMENT_STATUSES.map((status) => (
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

                <div className="mt-3 space-y-1 border-t border-[--line] pt-3">
                  {order.items.map((item) => (
                    <p
                      key={`${order.id}-${item.productId}-${item.variantId ?? "none"}`}
                      className="text-xs text-[--muted]"
                    >
                      {item.quantity} x {item.productName} ·{" "}
                      {formatMoney(item.lineTotal, order.currency)}
                    </p>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

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
                <div className="flex flex-wrap items-center gap-2">
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
                    {" · "}
                    {formatDate(request.createdAt)}
                  </p>
                  {request.preferredDate ? (
                    <p className="mt-1 text-xs text-[--muted]">
                      Preferred date: {request.preferredDate}
                    </p>
                  ) : null}
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
