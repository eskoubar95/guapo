/**
 * Barrel re-export — keeps existing import paths stable
 * (e.g. admin API routes that import label utilities from "./service").
 *
 * The provider class lives in services/shipmondo-fulfillment.ts.
 */
export { default } from "./services/shipmondo-fulfillment";
export type { ShipmondoOptions, ShipmondoPriceBand, ShipmondoProduct, ShipmondoWeightInterval } from "./types";
export {
  coerceLabelsEndpointResponse,
  coerceShipmondoShipmentRecord,
  extractShipmondoLabelBase64,
  shipmondoLabelFormat,
} from "./lib/labels";
