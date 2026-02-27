# Shipmondo API Integration (Guapo M10)

This document describes the Shipmondo API v3 integration for parcel shop (pakkeshop) shipping in Denmark. Used by the custom Medusa Fulfillment Module Provider in `src/modules/shipmondo/`.

## Overview

- **API version:** v3 (REST)
- **Documentation:** https://shipmondo.dev/
- **API Reference:** https://shipmondo.dev/api-reference (select Sandbox or Production server)

## Authentication

Shipmondo uses **HTTP Basic Authentication** with two credentials:

- **API User** — Your Shipmondo account email or API user identifier
- **API Key** — Secret key from Shipmondo (Account → API access)

Send every request with header:

```
Authorization: Basic <base64(api_user:api_key)>
```

Example (Node.js):

```js
const auth = Buffer.from(`${process.env.SHIPMONDO_API_USER}:${process.env.SHIPMONDO_API_KEY}`).toString("base64");
fetch(url, { headers: { Authorization: `Basic ${auth}` } });
```

**Do not commit API keys.** Use environment variables (`SHIPMONDO_API_USER`, `SHIPMONDO_API_KEY`).

## Sandbox vs Production

| Environment | Base URL |
|-------------|----------|
| **Production** | `https://app.shipmondo.com/api/public/v3/` |
| **Sandbox** | `https://sandbox.shipmondo.com/api/public/v3/` |

- **Sandbox:** Request access from Shipmondo support (reason, email, name). You receive separate login/API credentials. Supports GLS Denmark and dao. Unlimited test shipments; no real charges. Use `SHIPMONDO_SANDBOX=true` and sandbox base URL.
- **Production:** Use production base URL and production API keys from [API access](https://app.shipmondo.com/main/app/#/setting/api).
- **Transition:** When moving to live, switch the base URL from sandbox to production and use production keys.

## Endpoints Used by Guapo

### 1. Pickup points (pakkeshop search)

**GET** `/pickup_points`

Search for GLS or DAO parcel shops by postal code (and optional address).

| Query param | Required | Description |
|-------------|----------|-------------|
| `carrier_code` | Yes | `gls` or `dao` for Denmark |
| `country_code` | Yes | `DK` |
| `zipcode` | Yes | Danish postal code (e.g. `5000`) |
| `address` | No | Street address to refine distance |
| `limit` | No | Max results (default 10) |

**Example request:**

```
GET /pickup_points?carrier_code=gls&country_code=DK&zipcode=5000
```

**Example response (array of service points):**

```json
[
  {
    "number": "95892",
    "id": "95892",
    "company_name": "7-Eleven Odense C",
    "name": "7-Eleven Odense C",
    "address": "Vestergade 89",
    "address2": "Pakkeshop: 95892",
    "zipcode": "5000",
    "city": "Odense C",
    "country": "DK",
    "distance": 182,
    "longitude": 10.3807,
    "latitude": 55.3942,
    "agent": "gls",
    "carrier_code": "gls",
    "opening_hours": ["Man: 07:00-23:00", "Tir: 07:00-23:00", ...],
    "in_delivery": true,
    "out_delivery": true
  }
]
```

For creating a shipment, the important field is **`number`** (or `id`) — use as `service_point_id` in the shipment request.

### 2. Products (list available shipping products)

**GET** `/products?country_code=DK`

Returns available shipping products for the given country. Use to confirm product codes for your account (e.g. GLS Pakkeshop, DAO).

Typical product codes for Denmark parcel shop:

- **GLS Pakkeshop:** `GLSDK_SD` (GLS Denmark – service point delivery)
- **DAO:** Check `/products` response for dao product code (e.g. dao-related code)

### 3. Create shipment (label)

**POST** `/shipments`

Creates a shipment and can return label/label URL. Required for fulfillment: sender + receiver parties, product_code, parcels (weight), and for parcel shop: `service_point_id`.

**Minimal body for GLS Pakkeshop:**

```json
{
  "own_agreement": false,
  "product_code": "GLSDK_SD",
  "service_codes": "EMAIL_NT",
  "automatic_select_service_point": false,
  "service_point_id": "95892",
  "parties": [
    {
      "type": "sender",
      "name": "Sender Name",
      "address1": "Street 1",
      "postal_code": "5220",
      "city": "Odense SØ",
      "country_code": "DK",
      "email": "sender@example.com",
      "phone": "12345678"
    },
    {
      "type": "receiver",
      "name": "Customer Name",
      "address1": "Customer Street",
      "postal_code": "5000",
      "city": "Odense C",
      "country_code": "DK",
      "email": "customer@example.com",
      "mobile": "87654321"
    }
  ],
  "parcels": [{ "weight": 2000 }],
  "reference": "Order 12345",
  "print": false
}
```

- **weight** in `parcels`: grams (e.g. 2000 = 2 kg).
- **service_point_id:** From `/pickup_points` response (`number` or `id`).
- **print:** `false` to only create shipment and get label data (no print client).
- **reference:** Order ID or external reference.

Response includes shipment `id`, tracking info, and label URL or base64 label data depending on request/account.

### 4. Get shipment (tracking / label)

**GET** `/shipments/{id}`

Retrieve a single shipment (e.g. for tracking status or label document).

### 5. List shipments

**GET** `/shipments`

List shipments with optional filters (e.g. by reference, date).

## Product codes (MVP)

| Carrier | Product code | Description |
|---------|--------------|-------------|
| GLS Denmark | `GLSDK_SD` | GLS Pakkeshop (service point delivery) |
| DAO | (from `/products`) | DAO parcel shop — confirm code via API |

Required service for GLS: `EMAIL_NT` (email notification). Include in `service_codes`.

## Error handling

- API returns standard HTTP status codes (4xx client errors, 5xx server errors).
- Response body usually contains error message or validation details.
- **Rate limits:** Not strictly documented; use reasonable throttling and retries with backoff for 429/5xx.
- On failure: log response body, do not expose API key in logs.

## Environment variables (Guapo)

| Variable | Description |
|----------|-------------|
| `SHIPMONDO_API_USER` | Shipmondo API user (email or API user id) |
| `SHIPMONDO_API_KEY` | Shipmondo API key (secret) |
| `SHIPMONDO_SANDBOX` | `true` to use sandbox base URL; omit or `false` for production |

See `env.template` in this app for the full list.

## End-to-end test (M10 acceptance)

To validate the full shipping flow (t10.5):

1. **Prerequisites:** Commerce and storefront running; `SHIPMONDO_API_USER` and `SHIPMONDO_API_KEY` set in commerce (sandbox or production); Stripe configured; seed run so "Pakkeshop (39 kr)" option exists.
2. **Checkout:** In storefront, add a product to cart, go to checkout. Step 1: select "Pakkeshop" (GLS/DAO), enter postnummer (e.g. 1000), click Search, choose a pickup point from the list.
3. **Payment:** Proceed through steps 2 and 3; complete payment with a Stripe test card. Confirm order is created and shipping total is 39 DKK when Pakkeshop was selected.
4. **Fulfillment:** In Medusa Admin, open the order and create a fulfillment. The Shipmondo provider will call the Shipmondo API to create the shipment (and optionally return label data). Verify no errors; in sandbox, labels can be viewed in Shipmondo sandbox account.
5. **Documents:** Use "Get documents" / label retrieval in Admin for the fulfillment to confirm the provider returns label data when available.

If Shipmondo credentials are not set, the provider still registers; "Pakkeshop (39 kr)" will not appear in seed, and pickup-points proxy returns 503. With credentials, full flow from pakkeshop selection to label (or sandbox booking) can be verified.
