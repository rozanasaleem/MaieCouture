#!/usr/bin/env python3
import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path


def parse_bool(value: str, default: bool = False) -> bool:
    raw = (value or "").strip().lower()
    if raw in {"true", "1", "yes", "y"}:
        return True
    if raw in {"false", "0", "no", "n"}:
        return False
    return default


def parse_number(value: str):
    raw = (value or "").strip()
    if not raw:
        return None
    return round(float(raw), 2)


def parse_int(value: str, default: int = 0) -> int:
    raw = (value or "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def load_csv(path: Path) -> list[dict]:
    raw_text = path.read_text(encoding="utf-8-sig")
    lines = raw_text.splitlines()
    if not lines:
        return []

    header = lines[0]
    if ";" in header and header.count(";") >= header.count(","):
        delimiter = ";"
    elif "\t" in header:
        delimiter = "\t"
    else:
        delimiter = ","

    return list(csv.DictReader(lines, delimiter=delimiter))


def load_category_map(path: Path) -> dict[str, int]:
    data = json.loads(path.read_text(encoding="utf-8"))

    # Option 1: {"bridal": 12, "ready-to-wear": 13}
    if isinstance(data, dict):
        result = {}
        for slug, category_id in data.items():
            if category_id is None:
                continue
            result[str(slug)] = int(category_id)
        return result

    # Option 2: admin categories list [{"id":1, "slug":"bridal", ...}]
    if isinstance(data, list):
        result = {}
        for row in data:
            if not isinstance(row, dict):
                continue
            slug = row.get("slug")
            category_id = row.get("id")
            if slug and category_id is not None:
                result[str(slug)] = int(category_id)
        return result

    raise ValueError("Unsupported category map JSON format.")


def main():
    parser = argparse.ArgumentParser(description="Build POST-ready admin import payloads from cleaned CSV files.")
    parser.add_argument("--categories-csv", required=True)
    parser.add_argument("--products-csv", required=True)
    parser.add_argument("--variants-csv", required=True)
    parser.add_argument("--images-csv", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument(
        "--category-map-json",
        help="JSON file with slug->id map OR admin /admin/categories response list",
    )
    args = parser.parse_args()

    categories_csv = Path(args.categories_csv).expanduser().resolve()
    products_csv = Path(args.products_csv).expanduser().resolve()
    variants_csv = Path(args.variants_csv).expanduser().resolve()
    images_csv = Path(args.images_csv).expanduser().resolve()
    out_dir = Path(args.out_dir).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    categories_rows = load_csv(categories_csv)
    products_rows = load_csv(products_csv)
    variants_rows = load_csv(variants_csv)
    images_rows = load_csv(images_csv)

    images_by_product: dict[str, list[dict]] = defaultdict(list)
    for row in images_rows:
        slug = (row.get("product_slug") or "").strip()
        if not slug:
            continue
        image_url = (row.get("image_url") or "").strip()
        if not image_url:
            continue
        images_by_product[slug].append(
            {
                "imageUrl": image_url,
                "sortOrder": parse_int(row.get("sort_order"), 0),
            }
        )

    # sort + clean sortOrder
    for slug, rows in images_by_product.items():
        rows.sort(key=lambda r: r["sortOrder"])
        for idx, row in enumerate(rows, start=1):
            row["sortOrder"] = idx

    variants_by_product: dict[str, list[dict]] = defaultdict(list)
    for row in variants_rows:
        slug = (row.get("product_slug") or "").strip()
        if not slug:
            continue
        variants_by_product[slug].append(
            {
                "size": (row.get("size") or "").strip() or None,
                "color": (row.get("color") or "").strip() or None,
                "stockQuantity": parse_int(row.get("stock_quantity"), 0),
                "sku": (row.get("sku") or "").strip(),
                "madeToOrder": parse_bool(row.get("made_to_order"), False),
            }
        )

    categories_payload = []
    category_map_template = {}
    for row in categories_rows:
        slug = (row.get("slug") or "").strip()
        if not slug:
            continue
        categories_payload.append(
            {
                "name": (row.get("name") or "").strip(),
                "slug": slug,
                "description": (row.get("description") or "").strip() or None,
                "coverImage": (row.get("cover_image") or "").strip() or None,
                "published": parse_bool(row.get("published"), True),
                "sortOrder": parse_int(row.get("sort_order"), 0),
            }
        )
        category_map_template[slug] = None

    category_id_map = {}
    if args.category_map_json:
        category_id_map = load_category_map(Path(args.category_map_json).expanduser().resolve())

    products_payload_staging = []
    products_payload_ready = []
    unresolved_products = 0
    for row in products_rows:
        product_slug = (row.get("slug") or "").strip()
        category_slug = (row.get("category_slug") or "").strip()
        if not product_slug or not category_slug:
            continue

        product_obj = {
            "name": (row.get("name") or "").strip(),
            "slug": product_slug,
            "shortDescription": (row.get("short_description") or "").strip() or None,
            "fullDescription": (row.get("full_description") or "").strip() or None,
            "price": parse_number(row.get("price")),
            "salePrice": parse_number(row.get("sale_price")),
            "currency": ((row.get("currency") or "USD").strip() or "USD").upper(),
            "mainImage": (row.get("main_image") or "").strip(),
            "available": parse_bool(row.get("available"), True),
            "published": parse_bool(row.get("published"), True),
            "featured": parse_bool(row.get("featured"), False),
            "purchaseType": (row.get("purchase_type") or "DIRECT_PURCHASE").strip(),
            "productStatus": (row.get("product_status") or "EVERGREEN").strip(),
            "madeToOrder": parse_bool(row.get("made_to_order"), False),
            "leadTimeNote": (row.get("lead_time_note") or "").strip() or None,
            "categorySlug": category_slug,
            "images": images_by_product.get(product_slug, []),
            "variants": variants_by_product.get(product_slug, []),
        }
        products_payload_staging.append(product_obj)

        category_id = category_id_map.get(category_slug)
        if category_id is None:
            unresolved_products += 1
            continue

        ready_obj = dict(product_obj)
        ready_obj.pop("categorySlug", None)
        ready_obj["categoryId"] = category_id
        products_payload_ready.append(ready_obj)

    (out_dir / "categories.payload.json").write_text(
        json.dumps(categories_payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    (out_dir / "category-map.template.json").write_text(
        json.dumps(category_map_template, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    (out_dir / "products.payload.staging.json").write_text(
        json.dumps(products_payload_staging, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    if category_id_map:
        (out_dir / "products.payload.ready.json").write_text(
            json.dumps(products_payload_ready, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    summary = {
        "categoriesPayloadCount": len(categories_payload),
        "productsStagingCount": len(products_payload_staging),
        "productsReadyCount": len(products_payload_ready),
        "unresolvedProductsWithoutCategoryId": unresolved_products,
        "outputs": {
            "categoriesPayload": str(out_dir / "categories.payload.json"),
            "categoryMapTemplate": str(out_dir / "category-map.template.json"),
            "productsStaging": str(out_dir / "products.payload.staging.json"),
            "productsReady": str(out_dir / "products.payload.ready.json") if category_id_map else None,
        },
    }
    (out_dir / "payload-summary.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
