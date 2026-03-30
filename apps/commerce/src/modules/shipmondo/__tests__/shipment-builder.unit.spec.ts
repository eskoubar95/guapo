import {
  buildShipmondoReceiverParty,
  resolveShipmondoOrderReference,
} from "../lib/shipment-builder";

describe("shipment-builder", () => {
  describe("resolveShipmondoOrderReference", () => {
    it("prefers custom_display_id over display_id", () => {
      expect(
        resolveShipmondoOrderReference(
          { custom_display_id: "GU-1001", display_id: 42 } as Record<string, unknown>,
          "order_01x"
        )
      ).toBe("GU-1001");
    });

    it("uses display_id when no custom_display_id", () => {
      expect(
        resolveShipmondoOrderReference({ display_id: 42 } as Record<string, unknown>, "order_01x")
      ).toBe("42");
    });

    it("falls back to Medusa order id", () => {
      expect(resolveShipmondoOrderReference(undefined, "order_01x")).toBe("order_01x");
    });
  });

  describe("buildShipmondoReceiverParty", () => {
    it("uses order shipping address, not fulfillment service_point_* fields", () => {
      const party = buildShipmondoReceiverParty(
        {
          service_point_id: "123",
          service_point_address: "Pakkeshopvej 1",
          service_point_city: "København",
          service_point_zipcode: "2100",
        },
        {
          shipping_address: {
            first_name: "Nicklas",
            last_name: "Eskou",
            address_1: "Kundevej 10",
            city: "Hørsholm",
            postal_code: "2970",
            country_code: "DK",
            phone: "23347471",
          },
        } as Record<string, unknown>,
        "nick@example.com"
      );
      expect(party.address1).toBe("Kundevej 10");
      expect(party.city).toBe("Hørsholm");
      expect(party.postal_code).toBe("2970");
      expect(party.name).toBe("Nicklas Eskou");
    });
  });
});
