#!/usr/bin/env python3
import argparse
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path


PREDEFINED_CATEGORIES = [
    {
        "name": "Bridal",
        "slug": "bridal",
        "description": "Bridal couture for private fittings, katb ktab, engagement, and ceremony dressing.",
        "cover_image": "",
        "published": "true",
        "sort_order": "1",
    },
    {
        "name": "Traditional Wear",
        "slug": "traditional-wear",
        "description": "Palestinian heritage silhouettes and traditional embroidered statements.",
        "cover_image": "",
        "published": "true",
        "sort_order": "2",
    },
    {
        "name": "Evening Wear",
        "slug": "evening-wear",
        "description": "Elevated evening pieces designed for events, receptions, and special occasions.",
        "cover_image": "",
        "published": "true",
        "sort_order": "3",
    },
    {
        "name": "Ready-to-Wear",
        "slug": "ready-to-wear",
        "description": "Curated day-to-evening wardrobe staples available for direct purchase.",
        "cover_image": "",
        "published": "true",
        "sort_order": "4",
    },
    {
        "name": "Accessories",
        "slug": "accessories",
        "description": "Refined accessories including bags, wallets, and finishing touches.",
        "cover_image": "",
        "published": "true",
        "sort_order": "5",
    },
    {
        "name": "Home",
        "slug": "home",
        "description": "Home and lifestyle pieces including soaps and gifting essentials.",
        "cover_image": "",
        "published": "true",
        "sort_order": "6",
    },
]


def normalize(text: str) -> str:
    return (text or "").strip().lower()


def clean_sentence(text: str) -> str:
    text = " ".join((text or "").split())
    return text.strip()


def fallback_short_description(name: str, category_slug: str) -> str:
    phrases = {
        "bridal": "A couture bridal piece available through private appointment.",
        "traditional-wear": "A traditional statement piece inspired by Palestinian heritage.",
        "evening-wear": "An elegant evening silhouette crafted for elevated occasions.",
        "ready-to-wear": "A refined ready-to-wear design for modern everyday elegance.",
        "accessories": "A crafted accessory designed to complete your look.",
        "home": "A curated lifestyle piece designed for daily ritual and gifting.",
    }
    return f"{name}: {phrases.get(category_slug, 'A signature Maie Couture piece.')}"


def fallback_full_description(name: str, category_slug: str) -> str:
    themes = {
        "bridal": "bridal appointments and custom fitting sessions",
        "traditional-wear": "heritage-inspired craftsmanship and traditional detailing",
        "evening-wear": "formal dressing, receptions, and elevated celebrations",
        "ready-to-wear": "day-to-evening styling with versatile couture finishes",
        "accessories": "luxury styling accents and refined finishing details",
        "home": "elevated self-care, gifting, and home rituals",
    }
    theme = themes.get(category_slug, "modern couture styling")
    return (
        f"{name} is part of Maie Couture's curated edit, designed for {theme}. "
        "Crafted with premium materials and careful finishing, each piece balances "
        "timeless elegance with modern sophistication."
    )


def map_category(current_slug: str, product_name: str) -> str:
    slug = normalize(current_slug)
    name = normalize(product_name)

    if "bridal" in slug or "engagement" in slug or "henna" in slug or "katb" in slug:
        return "bridal"
    if "traditional" in slug or "thobe" in slug:
        return "traditional-wear"
    if "bags" in slug or "wallet" in slug or "accessor" in slug:
        return "accessories"
    if "soap" in slug or "home" in slug:
        return "home"
    if "dress" in slug and ("bridal" in name or "engagement" in name):
        return "bridal"
    if "dress" in slug:
        return "evening-wear"
    if slug in {"abayas", "jumpsuits", "outwear", "sets"}:
        return "ready-to-wear"
    return "ready-to-wear"

def infer_ready_to_wear_type(product_name: str, product_slug: str, category_slug: str) -> str:
    if category_slug != "ready-to-wear":
        return ""
    text = f"{normalize(product_name)} {normalize(product_slug)}"
    if "abaya" in text:
        return "abayas"
    if "jumpsuit" in text:
        return "jumpsuits"
    if "set" in text or "two piece" in text:
        return "sets"
    if "top" in text or "blouse" in text:
        return "tops-blouses"
    if "vest" in text or "blazer" in text or "outwear" in text:
        return "vests-blazers"
    return "dresses"

def infer_bridal_type(product_name: str, product_slug: str, category_slug: str) -> str:
    if category_slug != "bridal":
        return ""
    text = f"{normalize(product_name)} {normalize(product_slug)}"
    if "henna" in text:
        return "henna-dresses"
    if "katb" in text or "engagement" in text:
        return "katb-ktab"
    return "bridal-gowns"

def infer_accessory_type(product_name: str, product_slug: str, category_slug: str) -> str:
    if category_slug != "accessories":
        return ""
    text = f"{normalize(product_name)} {normalize(product_slug)}"
    if "shoe" in text:
        return "shoes"
    if "clutch" in text:
        return "clutches"
    if "scarf" in text:
        return "scarves"
    if "wallet" in text:
        return "wallets"
    return "bags"


def main():
    parser = argparse.ArgumentParser(description="Clean prefilled Maie catalog CSV files.")
    parser.add_argument("--input-dir", required=True, help="Folder containing prefilled CSV files")
    parser.add_argument("--output-dir", required=True, help="Folder to write cleaned CSV files")
    args = parser.parse_args()

    input_dir = Path(args.input_dir).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    products_path = input_dir / "products.csv"
    images_path = input_dir / "product_images.csv"
    variants_path = input_dir / "product_variants.csv"

    with products_path.open(newline="", encoding="utf-8") as f:
        products = list(csv.DictReader(f))

    with images_path.open(newline="", encoding="utf-8") as f:
        images = list(csv.DictReader(f))

    with variants_path.open(newline="", encoding="utf-8") as f:
        variants = list(csv.DictReader(f))

    # 1) Clean products + remap categories + ensure descriptions.
    remapped_counts = Counter()
    empty_short_filled = 0
    empty_full_filled = 0
    for row in products:
        new_slug = map_category(row.get("category_slug", ""), row.get("name", ""))
        remapped_counts[new_slug] += 1
        row["category_slug"] = new_slug

        short_desc = clean_sentence(row.get("short_description", ""))
        full_desc = clean_sentence(row.get("full_description", ""))

        if not short_desc:
            short_desc = fallback_short_description(row.get("name", "Piece"), new_slug)
            empty_short_filled += 1
        if not full_desc:
            full_desc = fallback_full_description(row.get("name", "Piece"), new_slug)
            empty_full_filled += 1

        row["short_description"] = short_desc
        row["full_description"] = full_desc
        product_slug = row.get("slug", "")
        row["ready_to_wear_type"] = infer_ready_to_wear_type(row.get("name", ""), product_slug, new_slug)
        row["bridal_type"] = infer_bridal_type(row.get("name", ""), product_slug, new_slug)
        row["accessory_type"] = infer_accessory_type(row.get("name", ""), product_slug, new_slug)

        if new_slug == "bridal":
            if row.get("purchase_type") == "DIRECT_PURCHASE":
                row["purchase_type"] = "APPOINTMENT_ONLY"
            row["made_to_order"] = "true"

    # 2) Remove duplicate images and re-sequence sort order per product.
    images_by_product = defaultdict(list)
    for row in images:
        product_slug = (row.get("product_slug") or "").strip()
        image_url = (row.get("image_url") or "").strip()
        if product_slug and image_url:
            images_by_product[product_slug].append(row)

    deduped_images = []
    duplicate_images_removed = 0
    for product_slug, rows in images_by_product.items():
        seen = set()
        unique_rows = []
        for row in rows:
            image_url = row["image_url"].strip()
            if image_url in seen:
                duplicate_images_removed += 1
                continue
            seen.add(image_url)
            unique_rows.append(row)

        for idx, row in enumerate(unique_rows, start=1):
            deduped_images.append(
                {
                    "product_slug": product_slug,
                    "image_url": row["image_url"].strip(),
                    "sort_order": str(idx),
                    "color": (row.get("color") or "").strip(),
                }
            )

    # 3) Write cleaned files.
    with (output_dir / "categories.csv").open("w", newline="", encoding="utf-8") as f:
        fieldnames = ["name", "slug", "description", "cover_image", "published", "sort_order"]
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for row in PREDEFINED_CATEGORIES:
            w.writerow(row)

    with (output_dir / "products.csv").open("w", newline="", encoding="utf-8") as f:
        fieldnames = [
            "name",
            "slug",
            "short_description",
            "full_description",
            "price",
            "sale_price",
            "currency",
            "main_image",
            "category_slug",
            "ready_to_wear_type",
            "bridal_type",
            "accessory_type",
            "available",
            "published",
            "featured",
            "purchase_type",
            "product_status",
            "made_to_order",
            "lead_time_note",
        ]
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(products)

    with (output_dir / "product_images.csv").open("w", newline="", encoding="utf-8") as f:
        fieldnames = ["product_slug", "image_url", "sort_order", "color"]
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(deduped_images)

    with (output_dir / "product_variants.csv").open("w", newline="", encoding="utf-8") as f:
        fieldnames = ["product_slug", "size", "color", "stock_quantity", "sku", "made_to_order"]
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(variants)

    summary = {
        "inputDir": str(input_dir),
        "outputDir": str(output_dir),
        "categoriesWritten": len(PREDEFINED_CATEGORIES),
        "productsWritten": len(products),
        "variantsWritten": len(variants),
        "imagesWritten": len(deduped_images),
        "duplicateImagesRemoved": duplicate_images_removed,
        "productCountsByCategory": dict(remapped_counts),
        "shortDescriptionsFilled": empty_short_filled,
        "fullDescriptionsFilled": empty_full_filled,
    }
    (output_dir / "clean-summary.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
