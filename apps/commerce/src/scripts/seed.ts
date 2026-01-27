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
  createProductsWorkflow,
  createProductCategoriesWorkflow,
  createInventoryItemsWorkflow,
} from "@medusajs/medusa/core-flows";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function seed({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);

  logger.info("🌱 Starting Guapo seed script...");

  // 1. Create default sales channel
  logger.info("Creating sales channel...");
  const { result: salesChannelResult } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "Guapo Webshop",
          description: "Guapo online storefront",
        },
      ],
    },
  });
  const salesChannel = salesChannelResult[0];
  logger.info(`✅ Created sales channel: ${salesChannel.id}`);

  // 2. Create stock location
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
  logger.info(`✅ Created stock location: ${stockLocation.id}`);

  // Link sales channel to stock location
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [salesChannel.id],
    },
  });
  logger.info("✅ Linked sales channel to stock location");

  // 3. Create shipping profile
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
  logger.info(`✅ Created shipping profile: ${shippingProfile.id}`);

  // 4. Create regions
  logger.info("Creating regions...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Denmark",
          currency_code: "dkk",
          countries: ["dk"],
          payment_providers: [], // Will be configured with Adyen later
        },
        {
          name: "Europe (EUR)",
          currency_code: "eur",
          countries: ["de", "se", "no", "fi", "nl", "be", "at"],
          payment_providers: [],
        },
      ],
    },
  });
  const dkRegion = regionResult.find(r => r.currency_code === "dkk");
  logger.info(`✅ Created ${regionResult.length} regions`);

  // 5. Create product categories
  logger.info("Creating product categories...");
  const { result: categoryResult } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        {
          name: "Skincare",
          handle: "skincare",
          is_active: true,
          is_internal: false,
        },
        {
          name: "Cleansers",
          handle: "cleansers",
          is_active: true,
          is_internal: false,
          parent_category_id: undefined, // Will be updated after first create
        },
        {
          name: "Serums",
          handle: "serums",
          is_active: true,
          is_internal: false,
        },
        {
          name: "Moisturizers",
          handle: "moisturizers",
          is_active: true,
          is_internal: false,
        },
        {
          name: "SPF",
          handle: "spf",
          is_active: true,
          is_internal: false,
        },
      ],
    },
  });
  logger.info(`✅ Created ${categoryResult.length} product categories`);

  // 6. Create test products
  logger.info("Creating test products...");
  
  const testProducts = [
    {
      title: "Gentle Cleanser",
      handle: "gentle-cleanser",
      description: "A mild, pH-balanced cleanser suitable for all skin types. Removes impurities without stripping the skin's natural moisture barrier.",
      status: "published" as const,
      options: [
        { title: "Size", values: ["150ml", "300ml"] }
      ],
      variants: [
        {
          title: "150ml",
          sku: "CLNS-150",
          manage_inventory: true,
          prices: [
            { amount: 18900, currency_code: "dkk" }, // 189 DKK
            { amount: 2500, currency_code: "eur" }, // 25 EUR
          ],
          options: { Size: "150ml" },
        },
        {
          title: "300ml",
          sku: "CLNS-300",
          manage_inventory: true,
          prices: [
            { amount: 29900, currency_code: "dkk" }, // 299 DKK
            { amount: 3900, currency_code: "eur" }, // 39 EUR
          ],
          options: { Size: "300ml" },
        },
      ],
      sales_channels: [{ id: salesChannel.id }],
    },
    {
      title: "Niacinamide Serum",
      handle: "niacinamide-serum",
      description: "10% Niacinamide serum for minimizing pores, reducing redness, and evening out skin tone. Suitable for all skin types.",
      status: "published" as const,
      options: [
        { title: "Size", values: ["30ml"] }
      ],
      variants: [
        {
          title: "30ml",
          sku: "NIAC-30",
          manage_inventory: true,
          prices: [
            { amount: 24900, currency_code: "dkk" }, // 249 DKK
            { amount: 3300, currency_code: "eur" }, // 33 EUR
          ],
          options: { Size: "30ml" },
        },
      ],
      sales_channels: [{ id: salesChannel.id }],
    },
    {
      title: "Hydrating Moisturizer",
      handle: "hydrating-moisturizer",
      description: "Lightweight, fast-absorbing moisturizer with hyaluronic acid. Perfect for daily use, morning and evening.",
      status: "published" as const,
      options: [
        { title: "Size", values: ["50ml", "100ml"] }
      ],
      variants: [
        {
          title: "50ml",
          sku: "MOIST-50",
          manage_inventory: true,
          prices: [
            { amount: 32900, currency_code: "dkk" }, // 329 DKK
            { amount: 4400, currency_code: "eur" }, // 44 EUR
          ],
          options: { Size: "50ml" },
        },
        {
          title: "100ml",
          sku: "MOIST-100",
          manage_inventory: true,
          prices: [
            { amount: 54900, currency_code: "dkk" }, // 549 DKK
            { amount: 7300, currency_code: "eur" }, // 73 EUR
          ],
          options: { Size: "100ml" },
        },
      ],
      sales_channels: [{ id: salesChannel.id }],
    },
    {
      title: "Daily SPF 50",
      handle: "daily-spf-50",
      description: "Broad spectrum SPF 50 sunscreen with a lightweight, non-greasy formula. No white cast. Suitable for daily wear.",
      status: "published" as const,
      options: [
        { title: "Size", values: ["50ml"] }
      ],
      variants: [
        {
          title: "50ml",
          sku: "SPF-50",
          manage_inventory: true,
          prices: [
            { amount: 27900, currency_code: "dkk" }, // 279 DKK
            { amount: 3700, currency_code: "eur" }, // 37 EUR
          ],
          options: { Size: "50ml" },
        },
      ],
      sales_channels: [{ id: salesChannel.id }],
    },
  ];

  const { result: productsResult } = await createProductsWorkflow(container).run({
    input: {
      products: testProducts,
    },
  });
  logger.info(`✅ Created ${productsResult.length} test products`);

  // 7. Create inventory for products
  logger.info("Creating inventory items...");
  const inventoryModule = container.resolve(Modules.INVENTORY);
  const productModule = container.resolve(Modules.PRODUCT);

  // Get all variants
  const variants = await productModule.listProductVariants({});
  
  for (const variant of variants) {
    if (variant.manage_inventory) {
      // Create inventory item
      const inventoryItem = await inventoryModule.createInventoryItems({
        sku: variant.sku,
        title: variant.title,
      });

      // Link variant to inventory item
      await link.create({
        [Modules.PRODUCT]: {
          variant_id: variant.id,
        },
        [Modules.INVENTORY]: {
          inventory_item_id: inventoryItem.id,
        },
      });

      // Create inventory level at stock location
      await inventoryModule.createInventoryLevels({
        inventory_item_id: inventoryItem.id,
        location_id: stockLocation.id,
        stocked_quantity: 100, // Initial stock
      });
    }
  }
  logger.info(`✅ Created inventory for ${variants.length} variants`);

  logger.info("");
  logger.info("🎉 Seed script completed successfully!");
  logger.info("");
  logger.info("📝 Summary:");
  logger.info(`   - 1 Sales Channel: ${salesChannel.name}`);
  logger.info(`   - 1 Stock Location: ${stockLocation.name}`);
  logger.info(`   - ${regionResult.length} Regions`);
  logger.info(`   - ${categoryResult.length} Product Categories`);
  logger.info(`   - ${productsResult.length} Products`);
  logger.info(`   - ${variants.length} Product Variants (with inventory)`);
  logger.info("");
  logger.info("🚀 You can now test the Store API:");
  logger.info("   GET  http://localhost:9000/store/products");
  logger.info("   POST http://localhost:9000/store/carts");
  logger.info("");
}
