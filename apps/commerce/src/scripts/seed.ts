/**
 * Seed script for Guapo Commerce
 * 
 * This script seeds the database with initial data for development and testing.
 * Run with: pnpm seed
 */

import { ExecArgs } from "@medusajs/framework/types";
import {
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  createStockLocationsWorkflow,
  createShippingProfilesWorkflow,
} from "@medusajs/medusa/core-flows";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function seed({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info("Starting Guapo seed script...");

  // Create default sales channel
  logger.info("Creating sales channel...");
  const { result: salesChannelResult } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "Default Sales Channel",
          description: "Guapo default sales channel",
        },
      ],
    },
  });
  const salesChannel = salesChannelResult[0];
  logger.info(`Created sales channel: ${salesChannel.id}`);

  // Create stock location
  logger.info("Creating stock location...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: "European Warehouse",
          address: {
            city: "Copenhagen",
            country_code: "DK",
            address_1: "Warehouse Street 1",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];
  logger.info(`Created stock location: ${stockLocation.id}`);

  // Link sales channel to stock location
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [salesChannel.id],
    },
  });
  logger.info("Linked sales channel to stock location");

  // Create shipping profile
  logger.info("Creating shipping profile...");
  const { result: shippingProfileResult } = await createShippingProfilesWorkflow(container).run({
    input: {
      data: [
        {
          name: "Default Shipping Profile",
          type: "default",
        },
      ],
    },
  });
  const shippingProfile = shippingProfileResult[0];
  logger.info(`Created shipping profile: ${shippingProfile.id}`);

  // Create region for Denmark (primary market)
  logger.info("Creating regions...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Denmark",
          currency_code: "dkk",
          countries: ["dk"],
          payment_providers: [], // Will be configured when Adyen is integrated
        },
        {
          name: "Europe (EUR)",
          currency_code: "eur",
          countries: ["de", "se", "no", "fi", "nl", "be", "at", "fr", "es", "it", "pt"],
          payment_providers: [],
        },
      ],
    },
  });
  logger.info(`Created ${regionResult.length} regions`);

  logger.info("Seed script completed successfully!");
  logger.info("Note: Fulfillment sets and shipping options will be configured in t3.3");
}
