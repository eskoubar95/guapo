/**
 * Migrate product.metadata.brand to Brand module link.
 *
 * 1. Reads all products with metadata.brand
 * 2. For each unique brand string: create Brand (handle, name) if not exists
 * 3. Link product to brand
 * 4. (Optional) Remove metadata.brand from product
 *
 * Run with: pnpm exec medusa exec ./src/scripts/migrate-metadata-brand-to-link.ts
 */
import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import type { LinkDefinition } from '@medusajs/framework/types'
import { BRAND_MODULE } from '../modules/brand'
import type BrandModuleService from '../modules/brand/service'

function toHandle(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export default async function migrate({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as { info: (m: string) => void }
  const link = container.resolve(ContainerRegistrationKeys.LINK) as {
    create: (l: LinkDefinition[]) => Promise<unknown>
    dismiss?: (l: LinkDefinition) => Promise<unknown>
  }
  const productModule = container.resolve(Modules.PRODUCT) as {
    listProducts: (filters: Record<string, unknown>, config?: { take?: number }) => Promise<
      Array<{ id: string; metadata?: Record<string, unknown> }>
    >
  }
  const brandService = container.resolve<BrandModuleService>(BRAND_MODULE)

  const products = (await productModule.listProducts({}, { take: 500 })) ?? []
  const byBrand = new Map<string, Array<{ id: string }>>()
  for (const p of products) {
    const b = p.metadata?.brand
    if (typeof b === 'string' && b.trim()) {
      const key = b.trim()
      const arr = byBrand.get(key) ?? []
      arr.push({ id: p.id })
      byBrand.set(key, arr)
    }
  }
  if (byBrand.size === 0) {
    logger.info('No products with metadata.brand found. Nothing to migrate.')
    return
  }

  const handleToBrandId = new Map<string, string>()
  for (const [brandName] of byBrand) {
    const handle = toHandle(brandName)
    if (!handle) continue
    const existing = await brandService.listBrands({ handle }, { take: 1 })
    let brandId: string
    if (existing.length > 0) {
      brandId = existing[0].id
      logger.info(`Using existing brand: ${brandName} (${handle})`)
    } else {
      const created = await brandService.createBrands([{ name: brandName, handle }])
      brandId = (Array.isArray(created) ? created[0] : created).id
      logger.info(`Created brand: ${brandName} (${handle})`)
    }
    handleToBrandId.set(handle, brandId)
  }

  let linked = 0
  for (const [brandName, productList] of byBrand) {
    const handle = toHandle(brandName)
    const brandId = handleToBrandId.get(handle)
    if (!brandId) continue
    const links: LinkDefinition[] = productList.map((p) => ({
      [Modules.PRODUCT]: { product_id: p.id },
      [BRAND_MODULE]: { brand_id: brandId },
    }))
    await link.create(links)
    linked += links.length
  }
  logger.info(`Linked ${linked} products to brands.`)

  logger.info('Migration complete. To remove metadata.brand from products, run updateProductsWorkflow per product with metadata: {} (omitting brand).')
}
