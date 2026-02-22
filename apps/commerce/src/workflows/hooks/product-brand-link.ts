import { createProductsWorkflow } from '@medusajs/medusa/core-flows'
import { StepResponse } from '@medusajs/framework/workflows-sdk'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import type { LinkDefinition } from '@medusajs/framework/types'
import { BRAND_MODULE } from '../../modules/brand'
import type BrandModuleService from '../../modules/brand/service'

/**
 * Hook into createProductsWorkflow.productsCreated.
 * When additional_data.brand_id is provided, links created products to that brand.
 */
createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => {
    const brandId = additional_data?.brand_id as string | undefined
    if (!brandId || !products?.length) {
      return new StepResponse([], [])
    }
    const brandService = container.resolve<BrandModuleService>(BRAND_MODULE)
    await brandService.retrieveBrand(brandId)
    const link = container.resolve<{ create: (links: LinkDefinition[]) => Promise<unknown> }>(
      ContainerRegistrationKeys.LINK
    )
    const links: LinkDefinition[] = products.map((product) => ({
      [Modules.PRODUCT]: { product_id: product.id },
      [BRAND_MODULE]: { brand_id: brandId },
    }))
    await link.create(links)
    return new StepResponse(links, links)
  }
)
