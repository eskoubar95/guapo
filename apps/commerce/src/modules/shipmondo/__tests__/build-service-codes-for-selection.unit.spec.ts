import { buildServiceCodesForSelection } from "../lib/build-service-codes-for-selection";
import type { ShipmondoProduct } from "../types";

describe("buildServiceCodesForSelection", () => {
  it("adds optional notifications only when toggled and available", () => {
    const p: ShipmondoProduct = {
      code: "X",
      service_point_product: true,
      required_services: [{ code: "FOO" }],
      available_services: [{ code: "EMAIL_NT" }, { code: "SMS_NT" }],
    };
    expect(
      buildServiceCodesForSelection(p, { emailNt: false, smsNt: true })
    ).toBe("FOO,SMS_NT");
    expect(
      buildServiceCodesForSelection(p, { emailNt: true, smsNt: false })
    ).toBe("FOO,EMAIL_NT");
  });

  it("falls back when no services", () => {
    const p: ShipmondoProduct = { code: "X", service_point_product: true };
    expect(buildServiceCodesForSelection(p, { emailNt: false, smsNt: false })).toBe("EMAIL_NT,SMS_NT");
  });
});
