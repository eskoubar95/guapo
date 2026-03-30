import type { Dictionary } from "@/i18n/dictionaries";
import type { PayloadArticleListItem } from "@/lib/payload-articles";

export function blogCategoryLabel(
  article: PayloadArticleListItem,
  dict: Dictionary
): string | null {
  const c = article.category;
  if (!c) return null;
  const map = dict.blog.categories;
  if (c in map) return map[c as keyof typeof map];
  return c;
}
