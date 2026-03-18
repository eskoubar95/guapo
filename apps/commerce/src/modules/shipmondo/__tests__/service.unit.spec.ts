/**
 * Unit tests for Shipmondo fulfillment service.
 * Mocks fetch to avoid real API calls.
 */
import ShipmondoFulfillmentService from "../service";

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

function createService(options: { apiUser?: string; apiKey?: string; sandbox?: boolean } = {}) {
  return new ShipmondoFulfillmentService(
    { logger: mockLogger as any },
    {
      apiUser: options.apiUser ?? "user",
      apiKey: options.apiKey ?? "key",
      sandbox: options.sandbox ?? false,
    }
  );
}

describe("ShipmondoFulfillmentService", () => {
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

  describe("getFulfillmentOptions", () => {
    it("returns fixed GLS, DAO, PostNord codes by default (no API list)", async () => {
      delete process.env.SHIPMONDO_CHECKOUT_CARRIER_CODES;
      delete process.env.SHIPMONDO_POSTNORD_PRODUCT_CODE;
      const service = createService();
      const options = await service.getFulfillmentOptions();
      expect(options).toHaveLength(3);
      expect(options.map((o) => o.id)).toEqual(["GLSDK_SD", "DAO_SD", "POSTDK_SD"]);
      expect(options[0].name).toBe("GLS Pakkeshop");
      expect(options[2].name).toBe("PostNord Pakkeshop");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns options from GET /products when SHIPMONDO_CHECKOUT_CARRIER_CODES=__API__", async () => {
      process.env.SHIPMONDO_CHECKOUT_CARRIER_CODES = "__API__";
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => [
          { code: "GLSDK_SD", name: "GLS Pakkeshop", service_point_product: true },
          { code: "DAO_SD", name: "DAO Pakkeshop", service_point_product: true },
        ],
      } as Response);
      const service = createService();
      const options = await service.getFulfillmentOptions();
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/products?country_code=DK"),
        expect.any(Object)
      );
      expect(options).toHaveLength(2);
      expect(options[0].id).toBe("GLSDK_SD");
      expect(options[0].name).toBe("GLS Pakkeshop");
      expect(options[1].id).toBe("DAO_SD");
      delete process.env.SHIPMONDO_CHECKOUT_CARRIER_CODES;
    });
  });

  describe("validateOption", () => {
    it("accepts gls-pakkeshop and dao-pakkeshop when __API__ mode", async () => {
      process.env.SHIPMONDO_CHECKOUT_CARRIER_CODES = "__API__";
      const service = createService();
      expect(await service.validateOption({ id: "gls-pakkeshop" })).toBe(true);
      expect(await service.validateOption({ id: "dao-pakkeshop" })).toBe(true);
      delete process.env.SHIPMONDO_CHECKOUT_CARRIER_CODES;
    });

    it("accepts fixed carrier codes by default", async () => {
      delete process.env.SHIPMONDO_CHECKOUT_CARRIER_CODES;
      const service = createService();
      expect(await service.validateOption({ id: "GLSDK_SD" })).toBe(true);
      expect(await service.validateOption({ id: "DAO_SD" })).toBe(true);
      expect(await service.validateOption({ id: "POSTDK_SD" })).toBe(true);
    });

    it("accepts product code from API when __API__ and GET /products returned that code", async () => {
      process.env.SHIPMONDO_CHECKOUT_CARRIER_CODES = "__API__";
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => [
          { code: "GLSDK_SD", name: "GLS Pakkeshop", service_point_product: true },
        ],
      } as Response);
      const service = createService();
      expect(await service.validateOption({ id: "GLSDK_SD" })).toBe(true);
      delete process.env.SHIPMONDO_CHECKOUT_CARRIER_CODES;
    });

    it("rejects invalid option ids", async () => {
      delete process.env.SHIPMONDO_CHECKOUT_CARRIER_CODES;
      const service = createService();
      expect(await service.validateOption({ id: "invalid" })).toBe(false);
      expect(await service.validateOption({})).toBe(false);
      expect(await service.validateOption({ id: 123 })).toBe(false);
    });
  });

  describe("validateFulfillmentData", () => {
    it("returns data with service_point_id from data", async () => {
      const service = createService();
      const result = await service.validateFulfillmentData(
        {},
        { service_point_id: "95892" },
        {}
      );
      expect(result).toEqual({ service_point_id: "95892" });
    });

    it("returns data with service_point_id from optionData when missing in data", async () => {
      const service = createService();
      const result = await service.validateFulfillmentData(
        { service_point_id: "12345" },
        {},
        {}
      );
      expect(result).toEqual({ service_point_id: "12345" });
    });

    it("returns original data when no service_point_id", async () => {
      const service = createService();
      const data = { other: "value" };
      const result = await service.validateFulfillmentData({}, data, {});
      expect(result).toEqual(data);
    });
  });

  describe("canCalculate", () => {
    it("returns true", async () => {
      const service = createService();
      expect(await service.canCalculate()).toBe(true);
    });
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
      expect(resultLow.calculated_amount).toBe(3900);
      const resultMid = await service.calculatePrice(optionData as any, undefined, {
        items: [{ quantity: 2, variant: { weight: 1500 } }],
      });
      expect(resultMid.calculated_amount).toBe(4900);
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
      expect(r.calculated_amount).toBe(2900);
    });

    it("reads flat_amount_minor from option root (matches seed shape)", async () => {
      const service = createService();
      const result = await service.calculatePrice(
        { product_code: "X", flat_amount_minor: 4200 } as any,
        undefined,
        undefined
      );
      expect(result.calculated_amount).toBe(4200);
    });

    it("uses optionData.data.flat_amount_minor when present and no price_bands", async () => {
      const service = createService();
      const result = await service.calculatePrice(
        { data: { flat_amount_minor: 4500 } } as any,
        undefined,
        undefined
      );
      expect(result.calculated_amount).toBe(4500);
    });

    it("falls back to env when no option data (SHIPMONDO_FLAT_RATE_MINOR)", async () => {
      process.env.SHIPMONDO_FLAT_RATE_MINOR = "4900";
      delete process.env.SHIPMONDO_PRICE_BANDS;
      const service = createService();
      const result = await service.calculatePrice();
      expect(result.calculated_amount).toBe(4900);
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
      expect(result.calculated_amount).toBe(3900);
      process.env.SHIPMONDO_PRICE_BANDS = "";
    });

    it("uses amount_minor from optionData when provided (no data object)", async () => {
      const service = createService();
      const result = await service.calculatePrice({ amount_minor: 2500 }, undefined, undefined);
      expect(result.calculated_amount).toBe(2500);
    });

    it("returns default flat rate when no option data and no env (fallback)", async () => {
      delete process.env.SHIPMONDO_FLAT_RATE_MINOR;
      delete process.env.SHIPMONDO_PRICE_BANDS;
      const service = createService();
      const result = await service.calculatePrice();
      expect(result).toEqual({
        calculated_amount: 3900,
        is_calculated_price_tax_inclusive: true,
      });
    });
  });

  describe("createFulfillment", () => {
    const minimalItems = [{ quantity: 1 }];
    const minimalOrder = { id: "order_1", email: "c@test.com" };
    const minimalFulfillment = {};

    it("returns dry_run and labels when SHIPMONDO_DRY_RUN=true", async () => {
      process.env.SHIPMONDO_DRY_RUN = "true";
      const service = createService();
      const result = await service.createFulfillment(
        { service_point_id: "95892" },
        minimalItems,
        minimalOrder,
        { ...minimalFulfillment, shipping_option_id: "gls-pakkeshop" } as any
      );
      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toMatchObject({
        dry_run: true,
        service_point_id: "95892",
        product_code: "GLSDK_SD",
        order_id: "order_1",
      });
      expect(result.labels).toHaveLength(1);
      expect(result.labels![0].tracking_number).toBe("DRY-RUN");
    });

    it("returns skipped when credentials are empty", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      const service = createService({ apiUser: "", apiKey: "" });
      const result = await service.createFulfillment(
        {},
        minimalItems,
        minimalOrder,
        minimalFulfillment as any
      );
      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toEqual({ skipped: true, reason: "no_credentials" });
      expect(result.labels).toEqual([]);
    });

    it("calls POST /shipments and returns labels on success", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          id: 42,
          pkg_no: "PKG123",
          tracking_url: "https://track.example/42",
          label_base64: "JVBERi0xLjQK",
        }),
      } as Response);
      const service = createService();
      const result = await service.createFulfillment(
        { service_point_id: "95892" },
        minimalItems,
        minimalOrder,
        { ...minimalFulfillment, shipping_option_id: "dao-pakkeshop" } as any
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toContain("/shipments");
      expect(fetchMock.mock.calls[0][1]?.method).toBe("POST");
      const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
      expect(body.product_code).toBe("DAO_SD");
      expect(result.labels).toHaveLength(1);
      expect(result.labels![0].tracking_number).toBe("PKG123");
      expect(result.data).toMatchObject({ shipment_id: 42, pkg_no: "PKG123" });
    });

    it("uses shipping_option_id as product_code when it is a product code (e.g. GLSDK_SD)", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ id: 1, pkg_no: "P1", tracking_url: "" }),
      } as Response);
      const service = createService();
      await service.createFulfillment(
        {},
        minimalItems,
        minimalOrder,
        { ...minimalFulfillment, shipping_option_id: "GLSDK_SD" } as any
      );
      const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
      expect(body.product_code).toBe("GLSDK_SD");
    });
  });

  describe("cancelFulfillment", () => {
    it("calls DELETE /shipments/{id} when shipment_id and credentials present", async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, status: 204 } as Response);
      const service = createService();
      await service.cancelFulfillment({ shipment_id: 99 });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toContain("/shipments/99");
      expect(fetchMock.mock.calls[0][1]?.method).toBe("DELETE");
    });

    it("does not call API when shipment_id is missing", async () => {
      const service = createService();
      await service.cancelFulfillment({});
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("does not call API when credentials are empty", async () => {
      const service = createService({ apiUser: "", apiKey: "" });
      await service.cancelFulfillment({ shipment_id: 99 });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("getFulfillmentDocuments", () => {
    it("returns empty array when shipment_id is null", async () => {
      const service = createService();
      const result = await service.getFulfillmentDocuments({});
      expect(result).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns label document when GET /shipments/{id} returns label_base64", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          label_base64: "JVBERi0xLjQK",
          pkg_no: "P1",
          tracking_url: "https://track.example/1",
        }),
      } as Response);
      const service = createService();
      const result = await service.getFulfillmentDocuments({ shipment_id: 1 });
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/shipments/1"),
        expect.any(Object)
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: "label" });
      expect((result[0] as any).url).toContain("data:application/pdf;base64,");
    });

    it("returns empty array when no credentials", async () => {
      const service = createService({ apiUser: "", apiKey: "" });
      const result = await service.getFulfillmentDocuments({ shipment_id: 1 });
      expect(result).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
