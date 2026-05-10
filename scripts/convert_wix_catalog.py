#!/usr/bin/env python3
import argparse
import csv
import json
import re
from collections import OrderedDict, defaultdict
from pathlib import Path


def slugify(value: str) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def parse_bool(value: str, default: bool = False) -> bool:
    if value is None:
        return default
    raw = value.strip().lower()
    if raw in {"true", "1", "yes", "y"}:
        return True
    if raw in {"false", "0", "no", "n"}:
        return False
    return default


def parse_price(raw: str):
    if raw is None:
        return None
    cleaned = raw.strip()
    if not cleaned:
        return None
    try:
        return round(float(cleaned), 2)
    except ValueError:
        return None


def parse_collections(raw: str) -> list[str]:
    if not raw:
        return []
    tokens = []
    for block in raw.split(";"):
        token = block.strip()
        if token:
            tokens.append(token)
    return tokens


def image_id_to_url(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return ""
    if value.startswith("http://") or value.startswith("https://"):
        return value
    return f"https://static.wixstatic.com/media/{value}"


def infer_purchase_type(collections: list[str]) -> str:
    joined = " ".join(collections).lower()
    appointment_keywords = {"bridal", "engagement", "henna", "katb"}
    if any(keyword in joined for keyword in appointment_keywords):
        return "APPOINTMENT_ONLY"
    return "DIRECT_PURCHASE"


def infer_product_status(ribbon: str, inventory: str) -> str:
    ribbon_text = (ribbon or "").strip().lower()
    inventory_text = (inventory or "").strip().lower()
    if "sold" in ribbon_text or inventory_text in {"outofstock", "out_of_stock", "out-of-stock"}:
        return "SOLD_OUT"
    if "limited" in ribbon_text:
        return "LIMITED"
    if "new" in ribbon_text:
        return "NEW"
    return "EVERGREEN"


def variant_stock(inventory: str) -> int:
    inventory_text = (inventory or "").strip().lower()
    if inventory_text in {"outofstock", "out_of_stock", "out-of-stock"}:
        return 0
    return 10


def extract_color(option_value: str) -> str:
    raw = (option_value or "").strip()
    if not raw:
        return ""
    if ":" in raw:
        return raw.split(":", 1)[1].strip()
    return raw


def main():
    parser = argparse.ArgumentParser(description="Convert Wix catalog CSV to backend-ready JSON payloads.")
    parser.add_argument("--input", required=True, help="Path to Wix CSV export")
    parser.add_argument("--out-dir", required=True, help="Output folder for JSON files")
    parser.add_argument("--currency", default="USD", help="Default currency for imported products (default: USD)")
    args = parser.parse_args()

    input_path = Path(args.input).expanduser().resolve()
    out_dir = Path(args.out_dir).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    with input_path.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))

    product_rows = [row for row in rows if row.get("fieldType") == "Product"]
    variant_rows = [row for row in rows if row.get("fieldType") == "Variant"]

    variants_by_handle: dict[str, list[dict]] = defaultdict(list)
    for row in variant_rows:
        handle = (row.get("handleId") or "").strip()
        if handle:
            variants_by_handle[handle].append(row)

    category_map: OrderedDict[str, dict] = OrderedDict()
    products = []

    for sort_order, row in enumerate(product_rows, start=1):
        handle_id = (row.get("handleId") or "").strip()
        name = (row.get("name") or "").strip()
        if not name:
            continue

        collection_tokens = parse_collections(row.get("collection") or "")
        if not collection_tokens:
            collection_tokens = ["Uncategorized"]

        # first collection token is the main category for MVP
        primary_collection = collection_tokens[0]
        category_slug = slugify(primary_collection) or f"category-{sort_order}"

        if category_slug not in category_map:
            category_map[category_slug] = {
                "name": primary_collection,
                "slug": category_slug,
                "description": f"{primary_collection} pieces for Maie Couture.",
                "coverImage": None,
                "published": True,
                "sortOrder": len(category_map) + 1,
            }

        price = parse_price(row.get("price"))
        discount_mode = (row.get("discountMode") or "").strip().lower()
        discount_value = parse_price(row.get("discountValue"))
        sale_price = None
        if price is not None and discount_mode == "amount" and discount_value:
            sale_price = max(0.0, round(price - discount_value, 2))
        elif price is not None and discount_mode == "percent" and discount_value:
            sale_price = round(price * (1 - (discount_value / 100.0)), 2)
            if sale_price == price:
                sale_price = None

        image_ids = [segment.strip() for segment in (row.get("productImageUrl") or "").split(";") if segment.strip()]
        image_urls = [image_id_to_url(image_id) for image_id in image_ids]
        main_image = image_urls[0] if image_urls else "https://placehold.co/800x1000?text=Maie+Couture"
        images_payload = [
            {"imageUrl": url, "sortOrder": idx + 1}
            for idx, url in enumerate(image_urls)
        ]

        purchase_type = infer_purchase_type(collection_tokens)
        status = infer_product_status(row.get("ribbon"), row.get("inventory"))
        made_to_order = purchase_type != "DIRECT_PURCHASE"
        visible = parse_bool(row.get("visible"), default=True)

        variant_payload = []
        for index, variant in enumerate(variants_by_handle.get(handle_id, []), start=1):
            size = (variant.get("productOptionDescription1") or "").strip() or None
            color = extract_color(variant.get("productOptionDescription2") or "")
            color = color or None
            sku = (variant.get("sku") or "").strip() or f"{slugify(name).upper()}-{index:03d}"
            variant_payload.append(
                {
                    "size": size,
                    "color": color,
                    "stockQuantity": variant_stock(variant.get("inventory")),
                    "sku": sku,
                    "madeToOrder": made_to_order,
                }
            )

        products.append(
            {
                "name": name,
                "slug": slugify(name) or f"product-{sort_order}",
                "shortDescription": (row.get("description") or "").strip()[:180],
                "fullDescription": (row.get("description") or "").strip(),
                "price": price,
                "salePrice": sale_price,
                "currency": args.currency.upper(),
                "mainImage": main_image,
                "available": status != "SOLD_OUT",
                "published": visible,
                "featured": False,
                "purchaseType": purchase_type,
                "productStatus": status,
                "madeToOrder": made_to_order,
                "leadTimeNote": "Available by appointment" if made_to_order else "Ships in 3-5 business days",
                "categorySlug": category_slug,
                "images": images_payload,
                "variants": variant_payload,
                "sourceHandleId": handle_id,
            }
        )

    categories = list(category_map.values())

    (out_dir / "categories.json").write_text(json.dumps(categories, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (out_dir / "products.staging.json").write_text(json.dumps(products, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    summary = {
        "input": str(input_path),
        "productsInCsv": len(product_rows),
        "variantsInCsv": len(variant_rows),
        "categoriesPrepared": len(categories),
        "productsPrepared": len(products),
        "notes": [
            "products.staging.json uses categorySlug; map slugs to category IDs before POST /admin/products",
            "Wix image IDs were expanded to static Wix media URLs",
            "Review purchaseType/productStatus before final import",
        ],
    }
    (out_dir / "import-summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Prepared {len(categories)} categories and {len(products)} products in {out_dir}")


if __name__ == "__main__":
    main()
