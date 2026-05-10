# Maie Data Templates

These CSV templates are ready to fill in Numbers or Excel.

## Core Import Order
1. `categories.csv`
2. `products.csv`
3. `product_images.csv`
4. `product_variants.csv`

## Required Enums

### `products.csv`
- `purchase_type`: `DIRECT_PURCHASE`, `APPOINTMENT_ONLY`, `INQUIRE_ONLY`
- `product_status`: `EVERGREEN`, `LIMITED`, `NEW`, `SOLD_OUT`, `ARCHIVED`
- `ready_to_wear_type` (optional, when `category_slug=ready-to-wear`):
  `abayas`, `sets`, `jumpsuits`, `tops-blouses`, `vests-blazers`, `dresses`
- `bridal_type` (optional, when `category_slug=bridal`):
  `bridal-gowns`, `katb-ktab`, `henna-dresses`
- `accessory_type` (optional, when `category_slug=accessories`):
  `shoes`, `bags`, `clutches`, `scarves`, `wallets`

### `orders.csv`
- `payment_status`: `PENDING`, `PAID`, `FAILED`, `REFUNDED`
- `order_status`: `PENDING`, `PROCESSING`, `SHIPPED`, `COMPLETED`, `CANCELLED`

### `custom_requests.csv`
- `request_type`: `BRIDAL`, `COUTURE`, `CUSTOM_FITTING`, `GENERAL_INQUIRY`
- `appointment_type`: `VIRTUAL`, `IN_PERSON`
- `status`: `NEW`, `CONTACTED`, `BOOKED`, `COMPLETED`, `CLOSED`
