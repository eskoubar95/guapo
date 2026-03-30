import type { HeroBlock, HomepageSection } from "@/lib/payload-homepage";
import { resolvePayloadMediaUrl } from "@/lib/payload-media-url";

/**
 * Background image URL when the **first** homepage section is a hero (above the fold).
 * Used for LCP preload and full-viewport load gate. If hero appears later, returns null
 * so we do not block the rest of the page.
 */
export function getAboveFoldHeroBackgroundImageUrl(
  sections: HomepageSection[] | null | undefined,
): string | null {
  if (!sections?.length) return null;
  const first = sections[0];
  if (first.blockType !== "hero") return null;
  const hero = first as HeroBlock;
  const variant = hero.variant ?? "full";
  if (variant === "video") return null;
  const url = resolvePayloadMediaUrl(hero.backgroundImage);
  return url || null;
}
