import { computeSubscriptionLineAdjustmentAmount } from "../subscription-discount";

describe("computeSubscriptionLineAdjustmentAmount", () => {
  const pct = 5;

  describe("is_tax_inclusive = false (ex-VAT unit_price)", () => {
    it("100 DKK ex-VAT → 5% = 5 DKK adjustment → Medusa total 118.75 (125 − 6.25 inkl.)", () => {
      const amount = computeSubscriptionLineAdjustmentAmount(
        { unit_price: 100, quantity: 1 },
        pct
      );
      expect(amount).toBe(5);
    });

    it("qty=2 → 200 DKK base → 10 DKK adjustment", () => {
      const amount = computeSubscriptionLineAdjustmentAmount(
        { unit_price: 100, quantity: 2 },
        pct
      );
      expect(amount).toBe(10);
    });

    it("112.50 DKK ex-VAT → 5% = 5.63 DKK", () => {
      const amount = computeSubscriptionLineAdjustmentAmount(
        { unit_price: 112.5, quantity: 1 },
        pct
      );
      expect(amount).toBe(5.63);
    });
  });

  describe("is_tax_inclusive = true (inkl. moms unit_price)", () => {
    it("150 DKK inkl. → ex-VAT 120 → 5% = 6 DKK adjustment → Medusa total 142.50 (150 − 7.50)", () => {
      const amount = computeSubscriptionLineAdjustmentAmount(
        { unit_price: 150, quantity: 1, is_tax_inclusive: true },
        pct
      );
      expect(amount).toBe(6);
    });

    it("125 DKK inkl. → ex-VAT 100 → 5% = 5 DKK adjustment → Medusa total 118.75", () => {
      const amount = computeSubscriptionLineAdjustmentAmount(
        { unit_price: 125, quantity: 1, is_tax_inclusive: true },
        pct
      );
      expect(amount).toBe(5);
    });
  });

  it("defaults to 0 when unit_price is missing", () => {
    const amount = computeSubscriptionLineAdjustmentAmount({}, pct);
    expect(amount).toBe(0);
  });
});
