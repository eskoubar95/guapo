import { Module } from "@medusajs/framework/utils";
import ShipmondoConfigModuleService from "./service";

export { SHIPMONDO_CONFIG_MODULE } from "./service";

export default Module("shipmondo_config", {
  service: ShipmondoConfigModuleService,
});
