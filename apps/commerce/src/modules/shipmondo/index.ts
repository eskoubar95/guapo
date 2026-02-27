import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import ShipmondoFulfillmentService from "./service";

const services = [ShipmondoFulfillmentService];

export default ModuleProvider(Modules.FULFILLMENT, {
  services,
});
