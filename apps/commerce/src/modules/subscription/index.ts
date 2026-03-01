import { Module } from "@medusajs/framework/utils";
import SubscriptionModuleService from "./service";

export const SUBSCRIPTION_MODULE = "subscriptionModule";

export default Module(SUBSCRIPTION_MODULE, {
  service: SubscriptionModuleService,
});
