import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils";
import type {
  CalculatedShippingOptionPrice,
  CreateFulfillmentResult,
  FulfillmentDTO,
  FulfillmentItemDTO,
  FulfillmentOption,
  FulfillmentOrderDTO,
} from "@medusajs/types";
import type { Logger } from "@medusajs/framework/types";

const FLAT_RATE_MINOR = 3900; // 39 DKK in minor units

export type ShipmondoOptions = {
  apiUser: string;
  apiKey: string;
  sandbox?: boolean;
};

type InjectedDependencies = {
  logger: Logger;
};

function getBaseUrl(sandbox: boolean): string {
  return sandbox
    ? "https://sandbox.shipmondo.com/api/public/v3"
    : "https://app.shipmondo.com/api/public/v3";
}

class ShipmondoFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = "shipmondo";

  protected logger_: Logger;
  protected options_: ShipmondoOptions;
  protected baseUrl_: string;

  constructor(
    { logger }: InjectedDependencies,
    options: ShipmondoOptions
  ) {
    super();
    this.logger_ = logger;
    this.options_ = options;
    this.baseUrl_ = getBaseUrl(!!options.sandbox);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: object
  ): Promise<T> {
    const url = `${this.baseUrl_}${path}`;
    const auth = Buffer.from(
      `${this.options_.apiUser}:${this.options_.apiKey}`
    ).toString("base64");
    const headers: Record<string, string> = {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    };
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger_.warn(`Shipmondo API ${method} ${path}: ${res.status} ${text}`);
      throw new Error(`Shipmondo API error: ${res.status} ${text}`);
    }
    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return undefined as T;
    }
    return res.json() as Promise<T>;
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      { id: "gls-pakkeshop" },
      { id: "dao-pakkeshop" },
    ];
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    return typeof data?.id === "string" && ["gls-pakkeshop", "dao-pakkeshop"].includes(data.id as string);
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const servicePointId = data?.service_point_id ?? optionData?.service_point_id;
    if (typeof servicePointId !== "string" || !servicePointId) {
      return data;
    }
    return { ...data, service_point_id: servicePointId };
  }

  async canCalculate(): Promise<boolean> {
    return true;
  }

  async calculatePrice(): Promise<CalculatedShippingOptionPrice> {
    return {
      calculated_amount: FLAT_RATE_MINOR,
      is_calculated_price_tax_inclusive: true,
    };
  }

  async createFulfillment(
    data: Record<string, unknown>,
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    fulfillment: Partial<Omit<FulfillmentDTO, "provider_id" | "data" | "items">>
  ): Promise<CreateFulfillmentResult> {
    const servicePointId = data?.service_point_id as string | undefined;

    // Dry-run: simulate fulfillment without calling Shipmondo (no real labels, no cost)
    if (process.env.SHIPMONDO_DRY_RUN === "true") {
      const optionId = (fulfillment as { shipping_option_id?: string })?.shipping_option_id;
      const productCode = optionId === "dao-pakkeshop" ? "DAO_SD" : "GLSDK_SD";
      this.logger_.info(
        `Shipmondo dry-run: would create shipment (product=${productCode}, service_point=${servicePointId ?? "auto"})`
      );
      return {
        data: {
          dry_run: true,
          service_point_id: servicePointId,
          product_code: productCode,
          order_id: order?.id,
        },
        labels: [{ tracking_number: "DRY-RUN", tracking_url: "", label_url: "" }],
      };
    }

    if (!this.options_.apiUser || !this.options_.apiKey) {
      this.logger_.warn("Shipmondo API credentials not set; skipping label creation");
      return {
        data: { skipped: true, reason: "no_credentials" },
        labels: [],
      };
    }

    const optionId = (fulfillment as { shipping_option_id?: string })?.shipping_option_id;
    const productCode = optionId === "dao-pakkeshop" ? "DAO_SD" : "GLSDK_SD";

    const orderId = order?.id ?? "unknown";
    const totalWeight = items.reduce((sum, i) => sum + ((i as { quantity?: number }).quantity ?? 1) * 500, 0) || 2000;

    const sender = {
      type: "sender",
      name: process.env.SHIPMONDO_SENDER_NAME ?? "Guapo",
      address1: process.env.SHIPMONDO_SENDER_ADDRESS ?? "",
      postal_code: process.env.SHIPMONDO_SENDER_POSTAL ?? "",
      city: process.env.SHIPMONDO_SENDER_CITY ?? "",
      country_code: "DK",
      email: process.env.SHIPMONDO_SENDER_EMAIL ?? "",
      phone: process.env.SHIPMONDO_SENDER_PHONE ?? "",
    };

    const orderRecord = order as Record<string, unknown> | undefined;
    const shippingAddress = orderRecord?.shipping_address ?? orderRecord?.delivery_address;
    const addr = shippingAddress as Record<string, unknown> | undefined;
    const receiver = {
      type: "receiver",
      name: (addr?.first_name && addr?.last_name
        ? `${addr.first_name} ${addr.last_name}`.trim()
        : (addr?.company ?? "Customer")) as string,
      address1: servicePointId
        ? ((data?.service_point_address ?? data?.service_point_name) as string) ?? "Pakkeshop"
        : (addr?.address_1 as string) ?? "",
      postal_code: (addr?.postal_code as string) ?? (data?.service_point_zipcode as string) ?? "",
      city: (addr?.city as string) ?? (data?.service_point_city as string) ?? "",
      country_code: ((addr?.country_code as string) ?? "DK").toUpperCase(),
      email: (orderRecord?.email as string) ?? "",
      mobile: (addr?.phone as string) ?? "",
    };

    try {
      const body = {
        own_agreement: false,
        product_code: productCode,
        service_codes: "EMAIL_NT",
        automatic_select_service_point: !servicePointId,
        ...(servicePointId && { service_point_id: servicePointId }),
        parties: [sender, receiver],
        parcels: [{ weight: Math.min(Math.max(totalWeight, 200), 30000) }],
        reference: String(orderId),
        print: false,
      };

      const shipment = await this.request<{
        id?: number;
        tracking_url?: string;
        label_base64?: string;
        pkg_no?: string;
      }>("POST", "/shipments", body);

      const labels: CreateFulfillmentResult["labels"] = [];
      if (shipment?.pkg_no || shipment?.tracking_url) {
        labels.push({
          tracking_number: shipment.pkg_no ?? String(shipment.id ?? ""),
          tracking_url: shipment.tracking_url ?? "",
          label_url: shipment.label_base64
            ? `data:application/pdf;base64,${shipment.label_base64}`
            : "",
        });
      }

      return {
        data: {
          shipment_id: shipment?.id,
          pkg_no: shipment?.pkg_no,
          tracking_url: shipment?.tracking_url,
        },
        labels,
      };
    } catch (err) {
      this.logger_.error(`Shipmondo createFulfillment failed: ${err instanceof Error ? err.message : String(err)}`);
      return {
        data: { error: err instanceof Error ? err.message : String(err) },
        labels: [],
      };
    }
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<unknown> {
    const id = data?.shipment_id as number | undefined;
    if (id != null && this.options_.apiUser && this.options_.apiKey) {
      try {
        await this.request("DELETE", `/shipments/${id}`);
      } catch (e) {
        this.logger_.warn(`Shipmondo cancelFulfillment: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    return {};
  }

  async getFulfillmentDocuments(data: Record<string, unknown>): Promise<never[]> {
    const id = data?.shipment_id as number | undefined;
    if (id == null || !this.options_.apiUser || !this.options_.apiKey) {
      return [];
    }
    try {
      const shipment = await this.request<{ label_base64?: string; pkg_no?: string; tracking_url?: string }>(
        "GET",
        `/shipments/${id}`
      );
      if (shipment?.label_base64) {
        return [
          {
            name: "label",
            url: `data:application/pdf;base64,${shipment.label_base64}`,
          },
        ] as never[];
      }
    } catch (e) {
      this.logger_.warn(`Shipmondo getFulfillmentDocuments: ${e instanceof Error ? e.message : String(e)}`);
    }
    return [];
  }

  async createReturnFulfillment(fulfillment: Record<string, unknown>): Promise<CreateFulfillmentResult> {
    this.logger_.info("Shipmondo createReturnFulfillment not implemented");
    return { data: { ...fulfillment }, labels: [] };
  }

  async getReturnDocuments(_data: Record<string, unknown>): Promise<never[]> {
    return [];
  }

  async getShipmentDocuments(data: Record<string, unknown>): Promise<never[]> {
    return this.getFulfillmentDocuments(data);
  }

  async retrieveDocuments(
    fulfillmentData: Record<string, unknown>,
    _documentType: string
  ): Promise<void> {
    await this.getFulfillmentDocuments(fulfillmentData);
  }
}

export default ShipmondoFulfillmentService;
