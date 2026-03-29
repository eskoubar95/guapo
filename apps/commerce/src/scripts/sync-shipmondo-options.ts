/**
 * Sync Shipmondo shipping options from API into Medusa.
 * Run with: pnpm sync:shipmondo  (or medusa exec ./src/scripts/sync-shipmondo-options.ts)
 */
import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { runShipmondoSync } from "../modules/shipmondo/run-sync";

export default async function syncShipmondoOptions({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  try {
    const result = await runShipmondoSync(container);
    logger.info(result.message);
  } catch (e) {
    logger.error(`Sync failed: ${e instanceof Error ? e.message : String(e)}`);
    throw e;
  }
}
