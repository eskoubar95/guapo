/**
 * Shared status → label + pill color for account area (orders + subscriptions).
 * Keep in sync with Medusa `order.status` and subscription module statuses.
 */

export type AccountStatusPill = {
  da: string;
  en: string;
  color: string;
};

/** Medusa store order statuses */
export const ORDER_STATUS_LABELS: Record<string, AccountStatusPill> = {
  pending: {
    da: "Afventer",
    en: "Pending",
    color: "bg-amber-100/90 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100",
  },
  processing: {
    da: "Behandles",
    en: "Processing",
    color: "bg-sky-100/90 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100",
  },
  shipped: {
    da: "Afsendt",
    en: "Shipped",
    color: "bg-violet-100/90 text-violet-900 dark:bg-violet-950/40 dark:text-violet-100",
  },
  delivered: {
    da: "Leveret",
    en: "Delivered",
    color: "bg-emerald-100/90 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
  },
  completed: {
    da: "Leveret",
    en: "Delivered",
    color: "bg-emerald-100/90 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
  },
  cancelled: {
    da: "Annulleret",
    en: "Cancelled",
    color: "bg-red-100/90 text-red-900 dark:bg-red-950/40 dark:text-red-100",
  },
  canceled: {
    da: "Annulleret",
    en: "Cancelled",
    color: "bg-red-100/90 text-red-900 dark:bg-red-950/40 dark:text-red-100",
  },
};

export const DEFAULT_ORDER_STATUS_LABEL: AccountStatusPill = {
  da: "Ukendt",
  en: "Unknown",
  color: "bg-muted text-muted-foreground",
};

/** Custom subscription module statuses */
export const SUBSCRIPTION_STATUS_LABELS: Record<string, AccountStatusPill> = {
  active: {
    da: "Aktiv",
    en: "Active",
    color: "bg-emerald-100/90 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
  },
  paused: {
    da: "Pauset",
    en: "Paused",
    color: "bg-amber-100/90 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100",
  },
  on_hold: {
    da: "Afventer betaling",
    en: "On hold",
    color: "bg-red-100/90 text-red-900 dark:bg-red-950/40 dark:text-red-100",
  },
  cancelled: {
    da: "Annulleret",
    en: "Cancelled",
    color: "bg-muted text-muted-foreground",
  },
  expired: {
    da: "Udløbet",
    en: "Expired",
    color: "bg-muted text-muted-foreground",
  },
};

export const DEFAULT_SUBSCRIPTION_STATUS_LABEL: AccountStatusPill = {
  da: "Ukendt",
  en: "Unknown",
  color: "bg-muted text-muted-foreground",
};

export function getOrderStatusPill(status: string | undefined): AccountStatusPill {
  return ORDER_STATUS_LABELS[status ?? ""] ?? DEFAULT_ORDER_STATUS_LABEL;
}

export function getSubscriptionStatusPill(status: string | undefined): AccountStatusPill {
  return SUBSCRIPTION_STATUS_LABELS[status ?? ""] ?? DEFAULT_SUBSCRIPTION_STATUS_LABEL;
}
