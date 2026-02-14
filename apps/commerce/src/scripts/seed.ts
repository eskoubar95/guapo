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
  createProductTypesWorkflow,
  createProductTagsWorkflow,
  updateProductsWorkflow,
  updateProductCategoriesWorkflow,
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
  }

  // Always ensure sales channel is linked to stock location (idempotent; safe if already linked)
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [salesChannel.id],
    },
  });
  logger.info("✅ Linked sales channel to stock location");

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

  // 5. Seed product types (cleanser, toner, serum, moisturizer, SPF, eye cream, face mask)
  const PRODUCT_TYPES = ["cleanser", "toner", "serum", "moisturizer", "SPF", "eye cream", "face mask"];
  logger.info("Checking product types...");
  const existingTypes = await productModule.listProductTypes({});
  const existingTypeValues = new Set((existingTypes ?? []).map((t) => t.value));
  const typesToCreate = PRODUCT_TYPES.filter((v) => !existingTypeValues.has(v));
  if (typesToCreate.length > 0) {
    await createProductTypesWorkflow(container).run({
      input: { product_types: typesToCreate.map((value) => ({ value })) },
    });
    logger.info(`✅ Created product types: ${typesToCreate.join(", ")}`);
  } else {
    logger.info(`✅ All product types already exist (${PRODUCT_TYPES.length})`);
  }
  const allTypes = await productModule.listProductTypes({});
  const typeByValue = new Map<string, string>();
  for (const t of allTypes ?? []) {
    typeByValue.set(t.value, t.id);
  }

  // 6. Seed product tags (skin types + concerns)
  const PRODUCT_TAGS = [
    "oily",
    "dry",
    "combination",
    "sensitive",
    "normal",
    "acne",
    "aging",
    "hydration",
    "pigmentation",
    "all-skin-types",
  ];
  logger.info("Checking product tags...");
  const existingTags = await productModule.listProductTags({});
  const existingTagValues = new Set((existingTags ?? []).map((t) => t.value));
  const tagsToCreate = PRODUCT_TAGS.filter((v) => !existingTagValues.has(v));
  const tagByValue = new Map<string, string>();
  for (const t of existingTags ?? []) {
    tagByValue.set(t.value, t.id);
  }
  if (tagsToCreate.length > 0) {
    const { result: createdTags } = await createProductTagsWorkflow(container).run({
      input: { product_tags: tagsToCreate.map((value) => ({ value })) },
    });
    for (const t of createdTags ?? []) {
      tagByValue.set(t.value, t.id);
    }
    logger.info(`✅ Created product tags: ${tagsToCreate.length} new`);
  } else {
    logger.info(`✅ All product tags already exist (${PRODUCT_TAGS.length})`);
  }
  const allTagsAfter = await productModule.listProductTags({});
  for (const t of allTagsAfter ?? []) {
    tagByValue.set(t.value, t.id);
  }

  // 7. Get or create product categories (with rank and hierarchy)
  logger.info("Checking product categories...");
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
            rank: 0,
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

  const childCategorySpecs = [
    { name: "Cleansers", handle: "cleansers", rank: 0 },
    { name: "Toners", handle: "toners", rank: 1 },
    { name: "Serums", handle: "serums", rank: 2 },
    { name: "Moisturizers", handle: "moisturizers", rank: 3 },
    { name: "SPF", handle: "spf", rank: 4 },
    { name: "Eye cream", handle: "eye-cream", rank: 5 },
    { name: "Face mask", handle: "face-mask", rank: 6 },
  ];
  const categoryByName = new Map<string, { id: string }>();
  categoryByName.set("Skincare", { id: parentCategory.id });
  let childCategoriesCreated = 0;

  for (const spec of childCategorySpecs) {
    const existing = await productModule.listProductCategories({ name: spec.name });
    if (existing.length === 0) {
      const { result } = await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: [
            {
              name: spec.name,
              handle: spec.handle,
              is_active: true,
              is_internal: false,
              parent_category_id: parentCategory.id,
              rank: spec.rank,
            },
          ],
        },
      });
      categoryByName.set(spec.name, { id: result[0].id });
      childCategoriesCreated++;
    } else {
      categoryByName.set(spec.name, { id: existing[0].id });
      const current = existing[0];
      if (typeof current.rank !== "number" || current.rank !== spec.rank) {
        await updateProductCategoriesWorkflow(container).run({
          input: {
            selector: { id: current.id },
            update: { rank: spec.rank },
          },
        });
      }
    }
  }
  logger.info(`✅ Child categories: ${childCategoriesCreated} created, ${childCategorySpecs.length} total with rank`);

  // 8. Get or create test products (with product_type, category, tags)
  logger.info("Checking test products...");
  const testProducts = [
    {
      title: "Gentle Cleanser",
      handle: "gentle-cleanser",
      description: "A mild, pH-balanced cleanser suitable for all skin types.",
      sku_prefix: "CLNS",
      product_type: "cleanser",
      category_name: "Cleansers",
      tag_values: ["normal", "combination", "hydration", "all-skin-types"],
      metadata: { brand: "Guapo", primary_skin_type: "normal", primary_concern: "hydration" },
      sizes: [
        { size: "150ml", dkk: 18900, eur: 2500, ean: "5701234001501" },
        { size: "300ml", dkk: 29900, eur: 3900, ean: "5701234003004" },
      ],
    },
    {
      title: "Niacinamide Serum",
      handle: "niacinamide-serum",
      description: "10% Niacinamide serum for minimizing pores and evening skin tone.",
      sku_prefix: "NIAC",
      product_type: "serum",
      category_name: "Serums",
      tag_values: ["oily", "acne", "pigmentation"],
      metadata: { brand: "Guapo", primary_skin_type: "oily", primary_concern: "acne" },
      sizes: [{ size: "30ml", dkk: 24900, eur: 3300, ean: "5701234003005" }],
    },
    {
      title: "Hydrating Moisturizer",
      handle: "hydrating-moisturizer",
      description: "Lightweight moisturizer with hyaluronic acid.",
      sku_prefix: "MOIST",
      product_type: "moisturizer",
      category_name: "Moisturizers",
      tag_values: ["dry", "hydration", "all-skin-types"],
      metadata: { brand: "Guapo", primary_skin_type: "dry", primary_concern: "hydration" },
      sizes: [
        { size: "50ml", dkk: 32900, eur: 4400, ean: "5701234005002" },
        { size: "100ml", dkk: 54900, eur: 7300, ean: "5701234010006" },
      ],
    },
    {
      title: "Daily SPF 50",
      handle: "daily-spf-50",
      description: "Broad spectrum SPF 50 with no white cast.",
      sku_prefix: "SPF",
      product_type: "SPF",
      category_name: "SPF",
      tag_values: ["sensitive", "all-skin-types"],
      metadata: { brand: "Guapo", primary_skin_type: "sensitive" },
      sizes: [{ size: "50ml", dkk: 27900, eur: 3700, ean: "5701234050003" }],
    },
  ];

  let productsCreated = 0;
  const createdProducts: any[] = [];
  const existingProducts: any[] = [];
  const allProductsInOrder: any[] = [];

  for (const productData of testProducts) {
    const existing = await productModule.listProducts({ handle: productData.handle });
    const typeId = typeByValue.get(productData.product_type) ?? undefined;
    const categoryId = categoryByName.get(productData.category_name)?.id;

    if (existing.length === 0) {
      const variants = productData.sizes.map((s) => ({
        title: s.size,
        sku: `${productData.sku_prefix}-${s.size.replace("ml", "")}`,
        ...(s.ean && { ean: s.ean }),
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
              ...(typeId && { product_type_id: typeId }),
              ...(categoryId && { categories: [{ id: categoryId }] }),
              ...(productData.metadata && Object.keys(productData.metadata).length > 0 && { metadata: productData.metadata }),
            },
          ],
        },
      });
      const product = result[0];
      createdProducts.push(product);
      allProductsInOrder.push(product);
      productsCreated++;
    } else {
      const product = existing[0];
      existingProducts.push(product);
      allProductsInOrder.push(product);
    }
  }
  // Apply type, categories, and tags to all products via update (tags applied here to avoid create-path issues)
  for (let i = 0; i < testProducts.length; i++) {
    const productData = testProducts[i];
    const product = allProductsInOrder[i];
    if (!product) continue;
    const typeId = typeByValue.get(productData.product_type) ?? undefined;
    const categoryId = categoryByName.get(productData.category_name)?.id;
    const tagIds: string[] = (productData.tag_values ?? [])
      .map((v) => tagByValue.get(v))
      .filter((id): id is string => id != null);
    await updateProductsWorkflow(container).run({
      input: {
        products: [
          {
            id: product.id,
            ...(typeId && { product_type_id: typeId }),
            ...(categoryId && { categories: [{ id: categoryId }] }),
            ...(tagIds.length > 0 && { tags: tagIds.map((id) => ({ id })) }),
            ...(productData.metadata && Object.keys(productData.metadata).length > 0 && { metadata: productData.metadata }),
          },
        ],
      },
    });
  }
  logger.info(`✅ Products: ${productsCreated} created, ${testProducts.length - productsCreated} already exist (type/category/tags/metadata applied)`);

  // 9. Ensure inventory for all test products (created + existing) – idempotent and self-healing
  const productsToEnsureInventory = [...createdProducts, ...existingProducts];
  if (productsToEnsureInventory.length > 0) {
    logger.info("Ensuring inventory items for all test products...");
    let inventoryCreatedCount = 0;

    for (const product of productsToEnsureInventory) {
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
  logger.info(`   - Categories: 1 parent + ${childCategorySpecs.length} children (Skincare tree with rank)`);
  logger.info(`   - Product types: ${PRODUCT_TYPES.length}; Tags: ${PRODUCT_TAGS.length}`);
  logger.info(`   - Products: ${testProducts.length} total, ${productsCreated} newly created`);
  logger.info("");
  logger.info("🚀 You can now test the Store API:");
  logger.info("   GET  http://localhost:9000/store/products");
  logger.info("   POST http://localhost:9000/store/carts");
  logger.info("");
}
