import {
  defineMiddlewares,
  authenticate,
  validateAndTransformBody,
} from "@medusajs/framework/http";
import { z } from "@medusajs/framework/zod";
import { storeShipmondoRateLimit } from "./middlewares/store-shipmondo-rate-limit";
import { storeOrderDocumentsRateLimit } from "./middlewares/store-order-documents-rate-limit";
import { storeSubscriptionsRateLimit } from "./middlewares/store-subscriptions-rate-limit";

const submitReviewSchema = z.object({
  product_id: z.string().min(1),
  rating: z.number().min(1).max(5),
  content: z.string().min(1).max(5000),
  headline: z.string().max(200).optional(),
});

const adminMergeSubscriptionsSchema = z.object({
  subscription_ids: z.array(z.string().min(1)).min(2),
  align_dates: z.boolean().optional(),
});

const adminSkipSubscriptionSchema = z.object({
  skip: z.boolean().optional(),
});

const deliveryDataPayloadSchema = z
  .object({
    service_point_id: z.union([z.string(), z.number()]).optional(),
    service_point_name: z.string().optional(),
    service_point_address: z.string().optional(),
    service_point_zipcode: z.string().optional(),
    service_point_city: z.string().optional(),
    carrier_code: z.string().optional(),
  })
  .passthrough();

const adminUpdateSubscriptionAddressSchema = z.object({
  delivery_data: z.union([deliveryDataPayloadSchema, z.null()]).optional(),
  shipping_address: z
    .object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      address_1: z.string().min(1),
      address_2: z.string().optional(),
      city: z.string().min(1),
      postal_code: z.string().min(1),
      country_code: z.string().min(2).max(2),
      phone: z.string().optional(),
      email: z.string().email().optional(),
    })
    .optional(),
  billing_address: z
    .object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      address_1: z.string().min(1),
      address_2: z.string().optional(),
      city: z.string().min(1),
      postal_code: z.string().min(1),
      country_code: z.string().min(2).max(2),
      phone: z.string().optional(),
      email: z.string().email().optional(),
    })
    .optional(),
});

const storeUpdateSubscriptionSchema = z.object({
  shipping_address: z
    .object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      address_1: z.string().min(1),
      address_2: z.string().optional(),
      city: z.string().min(1),
      postal_code: z.string().min(1),
      country_code: z.string().min(2).max(2),
      phone: z.string().optional(),
      email: z.string().email().optional(),
    })
    .optional(),
  billing_address: z
    .object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      address_1: z.string().min(1),
      address_2: z.string().optional(),
      city: z.string().min(1),
      postal_code: z.string().min(1),
      country_code: z.string().min(2).max(2),
      phone: z.string().optional(),
      email: z.string().email().optional(),
    })
    .optional(),
});

const shipmondoPriceBandSchema = z.object({
  max_grams: z.number().finite(),
  amount_minor: z.number().int(),
});

const shipmondoOptionPatchSchema = z
  .object({
    name: z.string().max(500).optional(),
    data: z
      .object({
        price_bands: z.array(shipmondoPriceBandSchema).max(200).optional(),
        flat_amount_minor: z.number().int().min(0).optional(),
        service_codes: z.string().max(4000).optional(),
      })
      .optional(),
  })
  .superRefine((val, ctx) => {
    const nameOk = typeof val.name === "string" && val.name.trim().length > 0;
    const raw = val.data;
    const dataOk =
      raw != null &&
      typeof raw === "object" &&
      Object.keys(raw as object).some((k) => {
        const v = (raw as Record<string, unknown>)[k];
        if (v === undefined) return false;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === "string") return v.length > 0;
        return true;
      });
    if (!nameOk && !dataOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide body.data (non-empty) and/or body.name",
      });
    }
  });

const shipmondoEnabledRowSchema = z.object({
  product_code: z.string().min(1).max(200),
  carrier_name: z.string().max(500).optional(),
  enabled: z.boolean().optional(),
});

const shipmondoEnabledPutSchema = z
  .object({
    product_code: z.string().min(1).max(200).optional(),
    carrier_name: z.string().max(500).optional(),
    enabled: z.boolean().optional(),
    product_codes: z.array(shipmondoEnabledRowSchema).max(1000).optional(),
  })
  .superRefine((val, ctx) => {
    const hasBatch = Array.isArray(val.product_codes) && val.product_codes.length > 0;
    const hasSingle = typeof val.product_code === "string" && val.product_code.trim().length > 0;
    if (!hasBatch && !hasSingle) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "product_code or non-empty product_codes required",
      });
    }
  });

const shipmondoOptionsImportBodySchema = z.object({
  exported_at: z.string().max(200).optional(),
  options: z
    .array(
      z.object({
        product_code: z.string().min(1).max(200),
        name: z.string().max(500).optional(),
        carrier_code: z.string().max(100).optional(),
        flat_amount_minor: z.number().int().min(0).optional(),
        price_bands: z.array(shipmondoPriceBandSchema).max(200).optional(),
        medusa_option_id: z.string().max(200).optional(),
      })
    )
    .min(1)
    .max(500),
});

const storeSubscriptionPaymentMethodSchema = z
  .object({
    action: z.enum(["create_setup_intent", "confirm_setup_intent"]),
    setup_intent_id: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === "confirm_setup_intent" && !value.setup_intent_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "setup_intent_id is required for confirm_setup_intent",
        path: ["setup_intent_id"],
      });
    }
  });

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/shipmondo/shipments/*/label",
      method: "GET",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/admin/shipmondo/options/*",
      method: "PATCH",
      middlewares: [validateAndTransformBody(shipmondoOptionPatchSchema)],
    },
    {
      matcher: "/admin/shipmondo/enabled",
      method: "PUT",
      middlewares: [validateAndTransformBody(shipmondoEnabledPutSchema)],
    },
    {
      matcher: "/admin/shipmondo/options/import",
      method: "POST",
      middlewares: [validateAndTransformBody(shipmondoOptionsImportBodySchema)],
    },
    {
      matcher: "/store/pickup-points",
      method: "GET",
      middlewares: [storeShipmondoRateLimit],
    },
    {
      matcher: "/store/shipping-options-with-pricing",
      method: "GET",
      middlewares: [storeShipmondoRateLimit],
    },
    {
      matcher: "/store/product-reviews/submit",
      method: "POST",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformBody(submitReviewSchema),
      ],
    },
    {
      matcher: "/store/subscriptions*",
      method: "GET",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/subscriptions*",
      method: "POST",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        storeSubscriptionsRateLimit,
      ],
    },
    {
      matcher: "/admin/subscriptions/merge",
      method: "POST",
      middlewares: [validateAndTransformBody(adminMergeSubscriptionsSchema)],
    },
    {
      matcher: "/admin/subscriptions/*/skip",
      method: "POST",
      middlewares: [validateAndTransformBody(adminSkipSubscriptionSchema)],
    },
    {
      matcher: "/admin/subscriptions/*/addresses",
      method: "POST",
      middlewares: [validateAndTransformBody(adminUpdateSubscriptionAddressSchema)],
    },
    {
      matcher: "/store/subscriptions/*/update",
      method: "POST",
      middlewares: [validateAndTransformBody(storeUpdateSubscriptionSchema)],
    },
    {
      matcher: "/store/subscriptions/*/payment-method",
      method: "POST",
      middlewares: [validateAndTransformBody(storeSubscriptionPaymentMethodSchema)],
    },
    {
      matcher: "/store/orders*",
      method: "GET",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/account/summary*",
      method: "GET",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/orders/*/documents/*",
      method: "GET",
      middlewares: [storeOrderDocumentsRateLimit],
    },
  ],
});
