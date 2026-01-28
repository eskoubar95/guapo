/**
 * Seed script for Guapo Commerce
 * 
 * This script seeds the database with initial data for development and testing.
 * It is IDEMPOTENT - safe to run multiple times without creating duplicates.
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
} from "@medusajs/medusa/core-flows";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function seed({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);

  logger.info("🌱 Starting Guapo seed script (idempotent)...");

  // Resolve modules for checking existing data
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL);
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION);
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT);
  const regionModule = container.resolve(Modules.REGION);
  // Product categories are accessed via the product module
  const productModule = container.resolve(Modules.PRODUCT);
  const inventoryModule = container.resolve(Modules.INVENTORY);

  // 1. Get or create sales channel
  logger.info("Checking sales channel...");
  let salesChannel;
  const existingSalesChannels = await salesChannelModule.listSalesChannels({
    name: "Guapo Webshop",
  });
  
  if (existingSalesChannels.length > 0) {
    salesChannel = existingSalesChannels[0];
    logger.info(`✅ Using existing sales channel: ${salesChannel.id}`);
  } else {
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
    salesChannel = salesChannelResult[0];
    logger.info(`✅ Created sales channel: ${salesChannel.id}`);
  }

  // 2. Get or create stock location
  logger.info("Checking stock location...");
  let stockLocation;
  const existingLocations = await stockLocationModule.listStockLocations({
    name: "European Warehouse",
  });
  
  if (existingLocations.length > 0) {
    stockLocation = existingLocations[0];
    logger.info(`✅ Using existing stock location: ${stockLocation.id}`);
  } else {
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
    stockLocation = stockLocationResult[0];
    logger.info(`✅ Created stock location: ${stockLocation.id}`);

    // Link sales channel to stock location (only when creating new)
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: {
        id: stockLocation.id,
        add: [salesChannel.id],
      },
    });
    logger.info("✅ Linked sales channel to stock location");
  }

  // 3. Get or create shipping profile
  logger.info("Checking shipping profile...");
  let shippingProfile;
  const existingProfiles = await fulfillmentModule.listShippingProfiles({
    name: "Default Shipping Profile",
  });
  
  if (existingProfiles.length > 0) {
    shippingProfile = existingProfiles[0];
    logger.info(`✅ Using existing shipping profile: ${shippingProfile.id}`);
  } else {
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
    shippingProfile = shippingProfileResult[0];
    logger.info(`✅ Created shipping profile: ${shippingProfile.id}`);
  }

  // 4. Get or create regions
  logger.info("Checking regions...");
  let regionsCreated = 0;
  
  // Check Denmark region
  const existingDkRegion = await regionModule.listRegions({ currency_code: "dkk" });
  if (existingDkRegion.length === 0) {
    await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Denmark",
            currency_code: "dkk",
            countries: ["dk"],
            payment_providers: [],
          },
        ],
      },
    });
    regionsCreated++;
    logger.info("✅ Created Denmark region");
  } else {
    logger.info("✅ Denmark region already exists");
  }

  // Check Europe region
  const existingEurRegion = await regionModule.listRegions({ currency_code: "eur" });
  if (existingEurRegion.length === 0) {
    await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Europe (EUR)",
            currency_code: "eur",
            countries: ["de", "se", "no", "fi", "nl", "be", "at"],
            payment_providers: [],
          },
        ],
      },
    });
    regionsCreated++;
    logger.info("✅ Created Europe region");
  } else {
    logger.info("✅ Europe region already exists");
  }

  // 5. Get or create product categories
  logger.info("Checking product categories...");
  
  // First, create or get parent category "Skincare"
  let parentCategory;
  const existingParent = await productModule.listProductCategories({ name: "Skincare" });
  if (existingParent.length === 0) {
    const { result: parentResult } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: "Skincare",
            handle: "skincare",
            is_active: true,
            is_internal: false,
          },
        ],
      },
    });
    parentCategory = parentResult[0];
    logger.info(`✅ Created parent category: Skincare (${parentCategory.id})`);
  } else {
    parentCategory = existingParent[0];
    logger.info(`✅ Using existing parent category: Skincare (${parentCategory.id})`);
  }

  // Then create child categories
  const childCategoryNames = ["Cleansers", "Serums", "Moisturizers", "SPF"];
  let childCategoriesCreated = 0;

  for (const name of childCategoryNames) {
    const existing = await productModule.listProductCategories({ name });
    if (existing.length === 0) {
      await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: [
            {
              name,
              handle: name.toLowerCase(),
              is_active: true,
              is_internal: false,
              parent_category_id: parentCategory.id,
            },
          ],
        },
      });
      childCategoriesCreated++;
    }
  }
  logger.info(`✅ Child categories: ${childCategoriesCreated} created, ${childCategoryNames.length - childCategoriesCreated} already exist`);

  // 6. Get or create test products
  logger.info("Checking test products...");
  const testProducts = [
    {
      title: "Gentle Cleanser",
      handle: "gentle-cleanser",
      description: "A mild, pH-balanced cleanser suitable for all skin types.",
      sku_prefix: "CLNS",
      sizes: [
        { size: "150ml", dkk: 18900, eur: 2500 },
        { size: "300ml", dkk: 29900, eur: 3900 },
      ],
    },
    {
      title: "Niacinamide Serum",
      handle: "niacinamide-serum",
      description: "10% Niacinamide serum for minimizing pores and evening skin tone.",
      sku_prefix: "NIAC",
      sizes: [{ size: "30ml", dkk: 24900, eur: 3300 }],
    },
    {
      title: "Hydrating Moisturizer",
      handle: "hydrating-moisturizer",
      description: "Lightweight moisturizer with hyaluronic acid.",
      sku_prefix: "MOIST",
      sizes: [
        { size: "50ml", dkk: 32900, eur: 4400 },
        { size: "100ml", dkk: 54900, eur: 7300 },
      ],
    },
    {
      title: "Daily SPF 50",
      handle: "daily-spf-50",
      description: "Broad spectrum SPF 50 with no white cast.",
      sku_prefix: "SPF",
      sizes: [{ size: "50ml", dkk: 27900, eur: 3700 }],
    },
  ];

  let productsCreated = 0;
  const createdProducts: any[] = [];

  for (const productData of testProducts) {
    const existing = await productModule.listProducts({ handle: productData.handle });
    
    if (existing.length === 0) {
      const variants = productData.sizes.map((s) => ({
        title: s.size,
        sku: `${productData.sku_prefix}-${s.size.replace("ml", "")}`,
        manage_inventory: true,
        prices: [
          { amount: s.dkk, currency_code: "dkk" },
          { amount: s.eur, currency_code: "eur" },
        ],
        options: { Size: s.size },
      }));

      const { result } = await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: productData.title,
              handle: productData.handle,
              description: productData.description,
              status: "published" as const,
              options: [{ title: "Size", values: productData.sizes.map((s) => s.size) }],
              variants,
              sales_channels: [{ id: salesChannel.id }],
            },
          ],
        },
      });
      createdProducts.push(result[0]);
      productsCreated++;
    }
  }
  logger.info(`✅ Products: ${productsCreated} created, ${testProducts.length - productsCreated} already exist`);

  // 7. Create inventory for newly created products
  if (createdProducts.length > 0) {
    logger.info("Creating inventory items...");
    let inventoryCreatedCount = 0;

    for (const product of createdProducts) {
      const productVariants = await productModule.listProductVariants({ product_id: product.id });

      for (const variant of productVariants) {
        if (variant.manage_inventory && variant.sku) {
          const existingItems = await inventoryModule.listInventoryItems({ sku: variant.sku });

          if (existingItems.length === 0) {
            const inventoryItem = await inventoryModule.createInventoryItems({
              sku: variant.sku,
              title: variant.title,
            });

            await link.create({
              [Modules.PRODUCT]: { variant_id: variant.id },
              [Modules.INVENTORY]: { inventory_item_id: inventoryItem.id },
            });

            await inventoryModule.createInventoryLevels({
              inventory_item_id: inventoryItem.id,
              location_id: stockLocation.id,
              stocked_quantity: 100,
            });

            inventoryCreatedCount++;
          }
        }
      }
    }
    logger.info(`✅ Created inventory for ${inventoryCreatedCount} variants`);
  }

  logger.info("");
  logger.info("🎉 Seed script completed successfully!");
  logger.info("");
  logger.info("📝 Summary:");
  logger.info(`   - Sales Channel: ${salesChannel.name}`);
  logger.info(`   - Stock Location: ${stockLocation.name}`);
  logger.info(`   - Regions: Denmark (DKK), Europe (EUR)`);
  logger.info(`   - Categories: 1 parent + ${childCategoryNames.length} children (Skincare tree)`);
  logger.info(`   - Products: ${testProducts.length} total, ${productsCreated} newly created`);
  logger.info("");
  logger.info("🚀 You can now test the Store API:");
  logger.info("   GET  http://localhost:9000/store/products");
  logger.info("   POST http://localhost:9000/store/carts");
  logger.info("");
}
