import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import ShipmondoFulfillmentService from "./services/shipmondo-fulfillment";

const services = [ShipmondoFulfillmentService];

export default ModuleProvider(Modules.FULFILLMENT, {
  services,
});
