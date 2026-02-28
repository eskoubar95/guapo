# Shipmondo API Integration (Guapo M10)

This document describes the Shipmondo API v3 integration for parcel shop (pakkeshop) shipping in Denmark. Used by the custom Medusa Fulfillment Module Provider in `src/modules/shipmondo/`.

## Overview

- **API version:** v3 (REST)
- **Documentation:** https://shipmondo.dev/
- **API Reference:** https://shipmondo.dev/api-reference
- **Shipping Module (recommended for checkout):** https://shipmondo.dev/docs/shipping_module/intro

## Authentication: Two Options

### 1. Shipping Module Key (recommended for pakkeshop search)

For **pakkeshop-søgning i checkout** anbefales Shipmondo's [Shipping Module API](https://shipmondo.dev/docs/shipping_module/intro). Den bruger en **shipping module key** (også kaldet Delivery Checkout key):

- **Opret nøgle:** Shipmondo → Settings → [Create a Shipping Module Key](https://help.shipmondo.com/en/articles/1897540-create-a-shipping-module-key)
- **Env:** `SHIPMONDO_SHIPPING_MODULE_KEY`
- **Fordele:** Virker i production uden sandbox, ingen ekstra omkostninger for pickup point-søgning, begrænset adgang (read-only)
- **Endpoints:** `/service_point/service_points`, `/shipping_modules/carriers`, `/shipping_modules/products`

### 2. API User + API Key (Basic Auth)

For **label-oprettelse** (fulfillment) bruges fuld API-adgang:

- **Opret:** [app.shipmondo.com](https://app.shipmondo.com/account/sign-up) → [API access](https://app.shipmondo.com/main/app/#/setting/api)
- **Env:** `SHIPMONDO_API_USER`, `SHIPMONDO_API_KEY`
- Bruges til: `POST /shipments`, `GET /shipments/{id}`, og som fallback til pickup points

**Prioritet i Guapo:** Hvis `SHIPMONDO_SHIPPING_MODULE_KEY` er sat, bruges den til pakkeshop-søgning. Ellers bruges API User + Key.

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
| `SHIPMONDO_SHIPPING_MODULE_KEY` | **Anbefalet:** Shipping Module Key til pakkeshop-søgning. Opret i Shipmondo Settings. |
| `SHIPMONDO_API_USER` | API user (til label-oprettelse og fallback for pickup points) |
| `SHIPMONDO_API_KEY` | API key (secret) |
| `SHIPMONDO_SANDBOX` | `true` til sandbox base URL; `false` eller udelad for production |
| `SHIPMONDO_DRY_RUN` | `true` for at simulere fulfillment uden at oprette rigtige labels (til test) |

Se `env.template` for fuld liste.

## Test uden sandbox og uden at købe labels

For at teste hele integrationen **uden** at anmode om sandbox og **uden** at købe ægte labels:

1. **Opret Shipping Module Key** i [Shipmondo](https://app.shipmondo.com/main/app/#/setting/api) (Settings → Shipping Module Key / Delivery Checkout). Sæt `SHIPMONDO_SHIPPING_MODULE_KEY` i commerce `.env`.
2. **Sæt `SHIPMONDO_DRY_RUN=true`** i commerce `.env`. Fulfillment simuleres; ingen rigtige labels oprettes.
3. **Sæt API User + Key** (`SHIPMONDO_API_USER`, `SHIPMONDO_API_KEY`) hvis du vil teste med Basic Auth fallback, eller lad dem være tomme hvis du kun bruger Shipping Module Key — fulfillment vil stadig køre i dry-run.
4. Kør seed, start commerce og storefront, og test hele flowet (checkout → pakkeshop-valg → betaling → ordre → fulfillment i Admin).

## End-to-end test (M10 acceptance)

1. **Prerequisites:** Commerce og storefront kører; `SHIPMONDO_SHIPPING_MODULE_KEY` (eller API User + Key) sat; Stripe konfigureret; seed kørt så "Pakkeshop (39 kr)" findes.
2. **Checkout:** Vælg Pakkeshop, indtast postnummer (f.eks. 1000), søg, vælg pakkeshop.
3. **Payment:** Gennemfør betaling med Stripe test kort. Bekræft ordre oprettes og fragt er 39 DKK.
4. **Fulfillment:** I Medusa Admin, åbn ordren og opret fulfillment. Med `SHIPMONDO_DRY_RUN=true` returneres simulerede data uden API-kald. Uden dry-run kaldes Shipmondo og labels oprettes (kræver saldo/aftale).

Uden credentials registreres provider stadig; "Pakkeshop (39 kr)" vises ikke i seed, og pickup-points returnerer 503.

## Kan man se integrationen i Shipmondo uden at oprette labels?

**Nej.** Med `SHIPMONDO_DRY_RUN=true` kalder Guapo slet ikke Shipmondo API for at oprette forsendelser. Alt simuleres lokalt — intet vises i Shipmondo-appen (hverken sandbox eller production). For at se en registrering i Shipmondo (f.eks. under Forsendelser > Booked) skal du slå dry-run fra og gennemføre et rigtigt fulfillment, der opretter en ægte label.

## Hvad sker der, hvis jeg slår dry-run fra?

**Uden dry-run** kalder Guapo Shipmondos `POST /shipments` API, når du opretter fulfillment i Medusa Admin. Det opretter en **ægte forsendelse** i Shipmondo og forbruger din saldo — du **betaler for labelen**. Der findes ikke en "registrer uden at betale"-tilstand i production. For at teste uden at betale skal du bruge Shipmondos **sandbox** (adgang via support) med `SHIPMONDO_SANDBOX=true` og sandbox-credentials.

## Kan jeg hente/prise labelen direkte i Medusa uden at åbne Shipmondo?

**Ja.** Når du opretter fulfillment i Medusa Admin (uden dry-run), returnerer Shipmondo-provideren label-data (PDF som base64). Medusa gemmer dette og eksponerer det via "Get documents" / fulfillment documents. Du kan downloade labelen direkte fra Medusa Admin uden at åbne Shipmondo-appen.

## Shipping address for pakkeshop

For pakkeshop-ordrer sættes **shipping address** på ordren til **pakkeshop-adressen** (det sted, hvor pakken fysisk leveres). Billing address forbliver kundens egen adresse. Det er korrekt registreret sådan i Medusa og bruges korrekt af Shipmondo-provideren ved label-oprettelse.
