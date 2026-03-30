/**
 * Shipmondo fulfillment — create/cancel/documents.
 * Mocks fetch to avoid real API calls.
 */
import { createService } from "./helpers/shipmondo-service-setup";

describe("ShipmondoFulfillmentService — fulfillment lifecycle", () => {
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
  describe("createFulfillment", () => {
    const minimalItems = [{ quantity: 1 }];
    const minimalOrder = { id: "order_1", email: "c@test.com" };
    const minimalFulfillment = {};
    const senderEnvKeys = [
      "SHIPMONDO_SENDER_ADDRESS",
      "SHIPMONDO_SENDER_POSTAL",
      "SHIPMONDO_SENDER_CITY",
      "SHIPMONDO_SENDER_EMAIL",
    ] as const;
    const savedSender: Record<string, string | undefined> = {};

    beforeEach(() => {
      process.env.SHIPMONDO_LABEL_GET_MAX_ATTEMPTS = "1";
      delete process.env.MEDUSA_BACKEND_URL;
      for (const k of senderEnvKeys) {
        savedSender[k] = process.env[k];
        process.env[k] =
          k === "SHIPMONDO_SENDER_ADDRESS"
            ? "Testvej 1"
            : k === "SHIPMONDO_SENDER_POSTAL"
              ? "2100"
              : k === "SHIPMONDO_SENDER_CITY"
                ? "København"
                : "shipmondo-unit@example.com";
      }
    });

    afterEach(() => {
      for (const k of senderEnvKeys) {
        const v = savedSender[k];
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    });

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

    it("throws when credentials are empty", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      const service = createService({ apiUser: "", apiKey: "" });
      await expect(
        service.createFulfillment({}, minimalItems, minimalOrder, minimalFulfillment as any)
      ).rejects.toThrow(/SHIPMONDO_API_USER/);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("calls POST /shipments with label_format and returns labels on success", async () => {
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
      expect(body.product_code).toBe("DAO_STS");
      expect(body.label_format).toBe("10x19_pdf");
      expect(body.print).toBe(false);
      expect(result.labels).toHaveLength(1);
      expect(result.labels![0].tracking_number).toBe("PKG123");
      expect(result.data).toMatchObject({ shipment_id: 42, pkg_no: "PKG123" });
    });

    it("uses SHIPMONDO_LABEL_FORMAT env to set label_format in POST body", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      process.env.SHIPMONDO_LABEL_FORMAT = "a4_pdf";
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          id: 1,
          pkg_no: "P",
          tracking_url: "",
          labels: [{ base64: "QQ==", file_format: "pdf" }],
        }),
      } as Response);
      const service = createService();
      await service.createFulfillment(
        { service_point_id: "95892" },
        minimalItems,
        minimalOrder,
        { ...minimalFulfillment, shipping_option_id: "GLSDK_SD" } as any
      );
      const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
      expect(body.label_format).toBe("a4_pdf");
      delete process.env.SHIPMONDO_LABEL_FORMAT;
    });

    it("uses admin label proxy URL when MEDUSA_BACKEND_URL is set (avoids data: URLs in Admin)", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      process.env.MEDUSA_BACKEND_URL = "http://localhost:9000";
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          id: 77,
          pkg_no: "PKG77",
          carrier_code: "gls",
          tracking_url: "",
          labels: [{ base64: "QkFDRDY0", file_format: "pdf" }],
        }),
      } as Response);
      const service = createService();
      const result = await service.createFulfillment(
        { service_point_id: "95892" },
        minimalItems,
        minimalOrder,
        { ...minimalFulfillment, shipping_option_id: "GLSDK_SD" } as any
      );
      expect(result.labels![0].label_url).toBe(
        "http://localhost:9000/admin/shipmondo/shipments/77/label"
      );
      expect(result.labels![0].tracking_url).toContain("gls-group.eu");
      delete process.env.MEDUSA_BACKEND_URL;
    });

    it("unwraps { shipment: { ... } } and reads labels[].base64", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          shipment: {
            id: 55,
            pkg_no: "PKG55",
            tracking_url: "",
            labels: [{ base64: "UERG", file_format: "pdf" }],
          },
        }),
      } as Response);
      const service = createService();
      const result = await service.createFulfillment(
        { service_point_id: "95892" },
        minimalItems,
        minimalOrder,
        { ...minimalFulfillment, shipping_option_id: "GLSDK_SD" } as any
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.data.shipment_id).toBe(55);
      expect(result.labels![0].label_url).toContain("data:application/pdf;base64,");
    });

    it("reads label from POST response labels[].base64 (Shipmondo API shape)", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          id: 77,
          pkg_no: "PKG77",
          tracking_url: "https://track.example/77",
          labels: [{ base64: "QkFDRDY0", file_format: "pdf" }],
        }),
      } as Response);
      const service = createService();
      const result = await service.createFulfillment(
        { service_point_id: "95892" },
        minimalItems,
        minimalOrder,
        { ...minimalFulfillment, shipping_option_id: "GLSDK_SD" } as any
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.labels![0].label_url).toContain("data:application/pdf;base64,");
    });

    it("stores labelless_code in fulfillment data when API returns no labels[] (labelless flow)", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      const labellessBody = {
        id: 100,
        pkg_no: "PKG100",
        tracking_url: "https://track.example/100",
        parcels: [{ weight: 500, labelless_code: "123456789", gls_colli_id: "999" }],
      };
      fetchMock
        // POST /shipments — no labels
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => labellessBody,
        } as Response)
        // GET /shipments/{id}/labels — 404 (no labels for labelless)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Headers(),
          text: async () => "Not Found",
        } as Response)
        // Fallback: GET /shipments/{id}
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => labellessBody,
        } as Response);
      const service = createService();
      const result = await service.createFulfillment(
        { service_point_id: "95892" },
        minimalItems,
        minimalOrder,
        { ...minimalFulfillment, shipping_option_id: "GLSDK_SD" } as any
      );
      expect(result.labels![0].label_url).toBe("");
      expect(result.data).toMatchObject({
        labelless_code: "123456789",
        gls_colli_id: "999",
      });
    });

    it("reads label from POST parcels[].labels[].base64 when top-level labels is empty", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          id: 88,
          pkg_no: "PKG88",
          tracking_url: "",
          parcels: [{ weight: 500, labels: [{ base64: "UEFSQ0VM", file_format: "pdf" }] }],
        }),
      } as Response);
      const service = createService();
      const result = await service.createFulfillment(
        { service_point_id: "95892" },
        minimalItems,
        minimalOrder,
        { ...minimalFulfillment, shipping_option_id: "GLSDK_SD" } as any
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.labels![0].label_url).toContain("data:application/pdf;base64,");
    });

    it("fetches label via GET /shipments/{id}/labels when POST omits label", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            id: 99,
            pkg_no: "PKG99",
            tracking_url: "https://track.example/99",
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => [{ base64: "QkFDRDY0", file_format: "pdf" }],
        } as Response);
      const service = createService();
      const result = await service.createFulfillment(
        { service_point_id: "95892" },
        minimalItems,
        minimalOrder,
        { ...minimalFulfillment, shipping_option_id: "GLSDK_SD" } as any
      );
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[1][0]).toContain("/shipments/99/labels");
      expect(fetchMock.mock.calls[1][1]?.method).toBe("GET");
      expect(result.labels![0].label_url).toContain("data:application/pdf;base64,");
    });

    it("falls back to GET /shipments/{id} when /labels endpoint fails", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            id: 99,
            pkg_no: "PKG99",
            tracking_url: "https://track.example/99",
          }),
        } as Response)
        // /labels endpoint 404
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Headers(),
          text: async () => "Not Found",
        } as Response)
        // fallback to GET /shipments/{id}
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            id: 99,
            parcels: [{ label_base64: "QkFDRDY0" }],
          }),
        } as Response);
      const service = createService();
      const result = await service.createFulfillment(
        { service_point_id: "95892" },
        minimalItems,
        minimalOrder,
        { ...minimalFulfillment, shipping_option_id: "GLSDK_SD" } as any
      );
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result.labels![0].label_url).toContain("data:application/pdf;base64,");
    });

    it("sets print true in POST body when SHIPMONDO_SHIPMENT_PRINT=true", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      process.env.SHIPMONDO_SHIPMENT_PRINT = "true";
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          id: 1,
          pkg_no: "P",
          tracking_url: "",
          label_base64: "QQ==",
        }),
      } as Response);
      const service = createService();
      await service.createFulfillment(
        { service_point_id: "95892" },
        minimalItems,
        minimalOrder,
        { ...minimalFulfillment, shipping_option_id: "GLSDK_SD" } as any
      );
      const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
      expect(body.print).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("throws when Shipmondo API returns error", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 422,
        headers: new Headers(),
        text: async () => '{"error":"bad"}',
      } as Response);
      const service = createService();
      await expect(
        service.createFulfillment(
          { service_point_id: "95892" },
          minimalItems,
          minimalOrder,
          { ...minimalFulfillment, shipping_option_id: "GLSDK_SD" } as any
        )
      ).rejects.toThrow(/Shipmondo shipment failed/);
    });

    it("uses customer.email when order.email is missing", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ id: 1, pkg_no: "P1", tracking_url: "" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({}),
        } as Response);
      const service = createService();
      await service.createFulfillment(
        { service_point_id: "95892" },
        minimalItems,
        { id: "order_2", customer: { email: "buyer@example.com" } } as any,
        { ...minimalFulfillment, shipping_option_id: "GLSDK_SD" } as any
      );
      const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
      const receiver = body.parties.find((p: { type: string }) => p.type === "receiver");
      expect(receiver.email).toBe("buyer@example.com");
    });

    it("throws INVALID_DATA when no receiver email and not sandbox", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      const service = createService({ sandbox: false });
      await expect(
        service.createFulfillment(
          {},
          minimalItems,
          { id: "order_x" } as any,
          { shipping_option_id: "GLSDK_SD" } as any
        )
      ).rejects.toThrow(/receiver email is required/);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("uses shipping_option_id as product_code when it is a product code (e.g. GLSDK_SD)", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ id: 1, pkg_no: "P1", tracking_url: "" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({}),
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

    it("resolves product_code from order shipping_methods when shipping_option_id is so_*", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ id: 1, pkg_no: "P1", tracking_url: "" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({}),
        } as Response);
      const service = createService();
      const orderWithMethods = {
        ...minimalOrder,
        shipping_methods: [
          {
            shipping_option_id: "so_01TEST",
            data: { product_code: "GLSDK_SD" },
          },
        ],
      };
      await service.createFulfillment(
        {},
        minimalItems,
        orderWithMethods as any,
        { ...minimalFulfillment, shipping_option_id: "so_01TEST" } as any
      );
      const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
      expect(body.product_code).toBe("GLSDK_SD");
    });

    it("resolves product_code from carrier_code on order shipping method when so_* and no product_code in method data", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ id: 1, pkg_no: "P1", tracking_url: "" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({}),
        } as Response);
      const service = createService();
      const orderWithCarrierOnly = {
        ...minimalOrder,
        shipping_methods: [
          {
            shipping_option_id: "so_01TEST",
            data: {
              service_point_id: "96319",
              carrier_code: "dao",
            },
          },
        ],
      };
      await service.createFulfillment(
        { service_point_id: "96319" },
        minimalItems,
        orderWithCarrierOnly as any,
        { ...minimalFulfillment, shipping_option_id: "so_01TEST" } as any
      );
      const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
      expect(body.product_code).toBe("DAO_STS");
    });

    it("sends configured product_code as-is when candidate is not in cached GET /products list (no carrier substitution)", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ id: 1, pkg_no: "P1", tracking_url: "" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({}),
        } as Response);
      const service = createService();
      (service as unknown as { productsCache_: unknown }).productsCache_ = {
        products: [
          { code: "DAO_PAKKESHOP", name: "DAO Pakkeshop", service_point_product: true, carrier_code: "dao" },
          { code: "GLSDK_SD", name: "GLS Pakkeshop", service_point_product: true, carrier_code: "gls",
            required_services: [{ code: "EMAIL_NT" }] },
        ],
        expiresAt: Date.now() + 60_000,
      };
      await service.createFulfillment(
        { service_point_id: "96319", carrier_code: "dao" },
        minimalItems,
        minimalOrder,
        { ...minimalFulfillment, shipping_option_id: "dao-pakkeshop" } as any
      );
      const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
      expect(body.product_code).toBe("DAO_STS");
    });

    it("uses required_services from API product as service_codes (carrier-specific)", async () => {
      process.env.SHIPMONDO_DRY_RUN = "false";
      delete process.env.SHIPMONDO_SERVICE_CODES;
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ id: 1, pkg_no: "P1", tracking_url: "" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({}),
        } as Response);
      const service = createService();
      (service as unknown as { productsCache_: unknown }).productsCache_ = {
        products: [
          {
            code: "DAO_SD",
            name: "DAO Pakkeshop",
            service_point_product: true,
            carrier_code: "dao",
            required_services: [{ code: "EMAIL_NT" }],
          },
          {
            code: "GLSDK_SD",
            name: "GLS Pakkeshop",
            service_point_product: true,
            carrier_code: "gls",
            required_services: [{ code: "EMAIL_NT" }],
          },
        ],
        expiresAt: Date.now() + 60_000,
      };
      await service.createFulfillment(
        { service_point_id: "96319" },
        minimalItems,
        minimalOrder,
        { ...minimalFulfillment, shipping_option_id: "DAO_SD" } as any
      );
      const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
      expect(body.product_code).toBe("DAO_SD");
      expect(body.service_codes).toBe("EMAIL_NT");
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
    beforeEach(() => {
      delete process.env.MEDUSA_BACKEND_URL;
    });

    it("returns empty array when shipment_id is null", async () => {
      const service = createService();
      const result = await service.getFulfillmentDocuments({});
      expect(result).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns label from GET /shipments/{id}/labels endpoint", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => [{ base64: "JVBERi0xLjQK", file_format: "pdf" }],
      } as Response);
      const service = createService();
      const result = await service.getFulfillmentDocuments({ shipment_id: 1 });
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/shipments/1/labels"),
        expect.any(Object)
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: "label" });
      expect((result[0] as any).url).toContain("data:application/pdf;base64,");
    });

    it("falls back to GET /shipments/{id} when /labels returns 404", async () => {
      fetchMock
        // /labels — 404
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Headers(),
          text: async () => "Not Found",
        } as Response)
        // fallback to GET /shipments/{id}
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers(),
          json: async () => ({
            id: 2,
            pkg_no: "P2",
            parcels: [{ label_base64: "JVBERi0xLjQK" }],
          }),
        } as Response);
      const service = createService();
      const result = await service.getFulfillmentDocuments({ shipment_id: 2 });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(1);
      expect((result[0] as { url: string }).url).toContain("data:application/pdf;base64,");
    });

    it("returns empty array when no credentials", async () => {
      const service = createService({ apiUser: "", apiKey: "" });
      const result = await service.getFulfillmentDocuments({ shipment_id: 1 });
      expect(result).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
