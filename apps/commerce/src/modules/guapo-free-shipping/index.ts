import { Module } from "@medusajs/framework/utils";
import GuapoFreeShippingModuleService, { GUAPO_FREE_SHIPPING_MODULE } from "./service";

export { GUAPO_FREE_SHIPPING_MODULE, GUAPO_FREE_SHIPPING_SETTING_ID } from "./service";

export default Module(GUAPO_FREE_SHIPPING_MODULE, {
  service: GuapoFreeShippingModuleService,
});
