import { buildServiceCodesFromProduct } from "../lib/build-service-codes-from-product";
import type { ShipmondoProduct } from "../types";

describe("buildServiceCodesFromProduct", () => {
  it("returns required first, then optional EMAIL_NT and SMS_NT when available", () => {
    const p: ShipmondoProduct = {
      code: "X",
      service_point_product: true,
      required_services: [{ code: "FOO" }],
      available_services: [
        { code: "EMAIL_NT" },
        { code: "SMS_NT" },
        { code: "OTHER" },
      ],
    };
    expect(buildServiceCodesFromProduct(p)).toBe("FOO,EMAIL_NT,SMS_NT");
  });

  it("does not duplicate EMAIL_NT when already required", () => {
    const p: ShipmondoProduct = {
      code: "X",
      service_point_product: true,
      required_services: [{ code: "EMAIL_NT" }],
      available_services: [{ code: "SMS_NT" }, { code: "EMAIL_NT" }],
    };
    expect(buildServiceCodesFromProduct(p)).toBe("EMAIL_NT,SMS_NT");
  });

  it("falls back to EMAIL_NT,SMS_NT when API lists no services", () => {
    const p: ShipmondoProduct = { code: "X", service_point_product: true };
    expect(buildServiceCodesFromProduct(p)).toBe("EMAIL_NT,SMS_NT");
  });
});
