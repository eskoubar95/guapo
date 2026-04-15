import { MedusaService } from "@medusajs/framework/utils";
import { ShipmondoEnabledProduct } from "./models/shipmondo-enabled-product";

export const SHIPMONDO_CONFIG_MODULE = "shipmondo_config";

class ShipmondoConfigModuleService extends MedusaService({
  ShipmondoEnabledProduct,
}) {}

export default ShipmondoConfigModuleService;
