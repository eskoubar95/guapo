/**
 * Category PLP: hardcoded FilterSystem (facet UI). Disabled by default for launch.
 * Set NEXT_PUBLIC_ENABLE_CATEGORY_PLP_FILTERS=true in .env.local to show filters while developing.
 */
export const categoryPlpFiltersEnabled =
  process.env.NEXT_PUBLIC_ENABLE_CATEGORY_PLP_FILTERS === "true";
