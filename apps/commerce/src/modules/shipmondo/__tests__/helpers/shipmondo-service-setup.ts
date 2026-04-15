import ShipmondoFulfillmentService from "../../services/shipmondo-fulfillment";
import type { ShipmondoProduct } from "../../types";

export const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

export const DEFAULT_TEST_PRODUCTS: ShipmondoProduct[] = [
  {
    code: "GLSDK_SD",
    name: "ShopDelivery",
    service_point_product: true,
    carrier_code: "gls",
    required_services: [
      { code: "EMAIL_NT", name: "E-mail advisering" },
      { code: "SMS_NT", name: "SMS advisering" },
    ],
  },
  {
    code: "DAO_STS",
    name: "daoSHOP (drop-off)",
    service_point_product: true,
    carrier_code: "dao",
    required_services: [
      { code: "EMAIL_NT", name: "E-mail advisering" },
      { code: "SMS_NT", name: "SMS advisering" },
    ],
  },
  {
    code: "PDK_MC",
    name: "Service Point",
    service_point_product: true,
    carrier_code: "pdk",
    required_services: [
      { code: "EMAIL_NT", name: "E-mail advisering" },
      { code: "SMS_NT", name: "SMS advisering" },
    ],
  },
];

export function createService(options: { apiUser?: string; apiKey?: string; sandbox?: boolean } = {}) {
  const svc = new ShipmondoFulfillmentService(
    { logger: mockLogger as any },
    {
      apiUser: options.apiUser ?? "user",
      apiKey: options.apiKey ?? "key",
      sandbox: options.sandbox ?? false,
    }
  );
  preSeedProductsCache(svc);
  return svc;
}

/** Pre-seed the internal products cache so tests don't need to mock GET /products. */
export function preSeedProductsCache(
  svc: ShipmondoFulfillmentService,
  products: ShipmondoProduct[] = DEFAULT_TEST_PRODUCTS
) {
  (svc as unknown as { productsCache_: { products: ShipmondoProduct[]; expiresAt: number } }).productsCache_ = {
    products,
    expiresAt: Date.now() + 60 * 60 * 1000,
  };
}
