import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/** Minimal Medusa container shape for resolving services. */
export type MedusaContainerLike = {
  resolve: <T = unknown>(key: string) => T;
};

export type QueryGraphOptions = {
  entity: string;
  fields: string[];
  filters?: Record<string, unknown>;
};

export type QueryService = {
  graph: (opts: QueryGraphOptions) => Promise<{ data: unknown[] }>;
};

export type PaymentModuleService = {
  listPayments: (
    filters: Record<string, unknown>,
    config?: { take?: number }
  ) => Promise<Array<{ id?: string; data?: Record<string, unknown>; provider_id?: string }>>;
};

export type OrderModuleService = {
  createOrders: (data: unknown[]) => Promise<Array<{ id: string }>>;
};

export type LinkService = {
  create: (links: Array<Record<string, Record<string, string>>>) => Promise<unknown>;
};

export function resolveQuery(container: MedusaContainerLike): QueryService {
  return container.resolve(ContainerRegistrationKeys.QUERY) as QueryService;
}

export function resolvePaymentModule(container: MedusaContainerLike): PaymentModuleService {
  return container.resolve(Modules.PAYMENT) as PaymentModuleService;
}

export function resolveOrderModule(container: MedusaContainerLike): OrderModuleService {
  return container.resolve(Modules.ORDER) as OrderModuleService;
}

export function resolveLink(container: MedusaContainerLike): LinkService {
  return container.resolve(ContainerRegistrationKeys.LINK) as LinkService;
}
