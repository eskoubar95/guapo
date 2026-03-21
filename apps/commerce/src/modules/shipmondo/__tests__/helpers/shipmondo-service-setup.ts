import ShipmondoFulfillmentService from "../../services/shipmondo-fulfillment";

export const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

export function createService(options: { apiUser?: string; apiKey?: string; sandbox?: boolean } = {}) {
  return new ShipmondoFulfillmentService(
    { logger: mockLogger as any },
    {
      apiUser: options.apiUser ?? "user",
      apiKey: options.apiKey ?? "key",
      sandbox: options.sandbox ?? false,
    }
  );
}
