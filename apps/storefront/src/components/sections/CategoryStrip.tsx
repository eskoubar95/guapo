import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

export interface CategoryLink {
  name: string;
  href: string;
  emoji?: string;
  image?: string;
  color?: string;
}

interface CategoryStripProps {
  categories: CategoryLink[];
  locale: string;
}

export function CategoryStrip({ categories, locale }: CategoryStripProps) {
  return (
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/${locale}${cat.href}`}
              className="flex flex-col items-center gap-2 min-w-[80px] group shrink-0"
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform ${
                  cat.color ?? "bg-surface-muted"
                }`}
              >
                {cat.image ? (
                  <ImageWithFallback
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">{cat.emoji ?? "✨"}</span>
                )}
              </div>
              <span className="text-xs text-center text-text-secondary group-hover:text-primary transition-colors font-medium">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
