/**
 * Shipmondo fulfillment — options, validation, canCalculate.
 * Mocks fetch to avoid real API calls.
 */
import { createService } from "./helpers/shipmondo-service-setup";

describe("ShipmondoFulfillmentService — options & validation", () => {
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

    it("adds product_code from optionData.id (Medusa fulfillment option = Shipmondo code)", async () => {
      const service = createService();
      const result = await service.validateFulfillmentData({ id: "GLSDK_SD", name: "GLS" }, {}, {});
      expect(result).toEqual({ product_code: "GLSDK_SD" });
    });

    it("prefers product_code from method data over optionData", async () => {
      const service = createService();
      const result = await service.validateFulfillmentData(
        { id: "GLSDK_SD" },
        { product_code: "DAO_SD" },
        {}
      );
      expect(result.product_code).toBe("DAO_SD");
    });
  });

  describe("canCalculate", () => {
    it("returns true", async () => {
      const service = createService();
      expect(await service.canCalculate()).toBe(true);
    });
  });
});
