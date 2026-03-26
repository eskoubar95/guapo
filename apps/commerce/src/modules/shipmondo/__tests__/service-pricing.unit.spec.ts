/**
 * Shipmondo fulfillment — calculatePrice.
 * Mocks fetch to avoid real API calls.
 */
import { createService } from "./helpers/shipmondo-service-setup";

describe("ShipmondoFulfillmentService — pricing", () => {
  const originalEnv = process.env;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    fetchMock = jest.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchMock.mockRestore();
  });
  describe("calculatePrice", () => {
    it("uses optionData.data.price_bands when present (Admin primary)", async () => {
      const service = createService();
      const optionData = {
        data: {
          price_bands: [
            { max_grams: 2000, amount_minor: 3900 },
            { max_grams: 5000, amount_minor: 4900 },
          ],
        },
      };
      const resultLow = await service.calculatePrice(optionData as any, undefined, {
        items: [{ quantity: 1, variant: { weight: 500 } }],
      });
      expect(resultLow.calculated_amount).toBe(39);
      const resultMid = await service.calculatePrice(optionData as any, undefined, {
        items: [{ quantity: 2, variant: { weight: 1500 } }],
      });
      expect(resultMid.calculated_amount).toBe(49);
    });

    it("uses top-level price_bands on option JSON (seed / flat Admin shape)", async () => {
      const service = createService();
      const optionData = {
        product_code: "GLSDK_SD",
        price_bands: [
          { max_grams: 1000, amount_minor: 2900 },
          { max_grams: 10000, amount_minor: 5900 },
        ],
      };
      const r = await service.calculatePrice(optionData as any, undefined, {
        items: [{ quantity: 1, variant: { weight: 800 } }],
      });
      expect(r.calculated_amount).toBe(29);
    });

    it("reads flat_amount_minor from option root (matches seed shape)", async () => {
      const service = createService();
      const result = await service.calculatePrice(
        { product_code: "X", flat_amount_minor: 4200 } as any,
        undefined,
        undefined
      );
      expect(result.calculated_amount).toBe(42);
    });

    it("uses optionData.data.flat_amount_minor when present and no price_bands", async () => {
      const service = createService();
      const result = await service.calculatePrice(
        { data: { flat_amount_minor: 4500 } } as any,
        undefined,
        undefined
      );
      expect(result.calculated_amount).toBe(45);
    });

    it("falls back to env when no option data (SHIPMONDO_FLAT_RATE_MINOR)", async () => {
      process.env.SHIPMONDO_FLAT_RATE_MINOR = "4900";
      delete process.env.SHIPMONDO_PRICE_BANDS;
      const service = createService();
      const result = await service.calculatePrice();
      expect(result.calculated_amount).toBe(49);
      process.env.SHIPMONDO_FLAT_RATE_MINOR = "";
    });

    it("falls back to env bands when no option data and weight in context", async () => {
      process.env.SHIPMONDO_PRICE_BANDS = JSON.stringify([
        { max_grams: 2000, amount_minor: 3900 },
        { max_grams: 5000, amount_minor: 4900 },
      ]);
      const service = createService();
      const result = await service.calculatePrice(undefined, undefined, {
        items: [{ quantity: 1, variant: { weight: 500 } }],
      });
      expect(result.calculated_amount).toBe(39);
      process.env.SHIPMONDO_PRICE_BANDS = "";
    });

    it("uses amount_minor from optionData when provided (no data object)", async () => {
      const service = createService();
      const result = await service.calculatePrice({ amount_minor: 2500 }, undefined, undefined);
      expect(result.calculated_amount).toBe(25);
    });

    it("returns default flat rate when no option data and no env (fallback)", async () => {
      delete process.env.SHIPMONDO_FLAT_RATE_MINOR;
      delete process.env.SHIPMONDO_PRICE_BANDS;
      const service = createService();
      const result = await service.calculatePrice();
      expect(result).toEqual({
        calculated_amount: 31.2,
        is_calculated_price_tax_inclusive: false,
      });
    });
  });
});
