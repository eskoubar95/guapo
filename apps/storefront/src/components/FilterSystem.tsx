"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, ChevronRight, ChevronLeft, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface FilterCategory {
  id: string;
  label: string;
  options: { value: string; count?: number }[];
}

interface FilterSystemProps {
  categories: FilterCategory[];
  labels: {
    filters: string;
    clearFilters: string;
    activeFilters: string;
  };
  className?: string;
}

export function FilterSystem({ categories, labels, className }: FilterSystemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const selectedFilters = useMemo(() => {
    const out: Record<string, string[]> = {};
    categories.forEach((cat) => {
      const val = searchParams.get(cat.id);
      if (val) out[cat.id] = val.split(",").filter(Boolean);
    });
    return out;
  }, [categories, searchParams]);

  const syncUrl = (filters: Record<string, string[]>) => {
    const next = new URLSearchParams(searchParams.toString());
    categories.forEach((cat) => next.delete(cat.id));
    Object.entries(filters).forEach(([id, values]) => {
      if (values.length) next.set(id, values.join(","));
    });
    const q = next.toString();
    router.replace(`${pathname}${q ? `?${q}` : ""}`, { scroll: false });
  };

  const handleFilterToggle = (categoryId: string, option: string) => {
    const categoryFilters = selectedFilters[categoryId] || [];
    const newFilters = categoryFilters.includes(option)
      ? categoryFilters.filter((f) => f !== option)
      : [...categoryFilters, option];
    syncUrl({ ...selectedFilters, [categoryId]: newFilters });
  };

  const clearAllFilters = () => {
    syncUrl({});
  };

  const totalActiveFilters = Object.values(selectedFilters).flat().length;
  const isFilterSelected = (categoryId: string, option: string) =>
    selectedFilters[categoryId]?.includes(option) ?? false;

  const openCategorySheet = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
    setSelectedCategory(null);
  };

  const currentCategory = categories.find((c) => c.id === selectedCategory);

  return (
    <div className={cn(className)}>
      {/* Filter bar */}
      <div className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="flex items-center gap-3 overflow-x-auto py-3 scrollbar-hide">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory(null);
              setIsSheetOpen(true);
            }}
            className="flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {labels.filters}
            {totalActiveFilters > 0 && (
              <span className="rounded-full bg-primary-foreground px-2 py-0.5 text-xs font-bold text-primary">
                {totalActiveFilters}
              </span>
            )}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => openCategorySheet(category.id)}
              className="flex shrink-0 items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted/80"
            >
              {category.label}
              {(selectedFilters[category.id]?.length ?? 0) > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                  {selectedFilters[category.id].length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sheet */}
      {isSheetOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={closeSheet}
            aria-hidden
          />
          <div
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-xl animate-in slide-in-from-right duration-200"
            role="dialog"
            aria-modal="true"
            aria-label={labels.filters}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              {selectedCategory ? (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="-ml-2 rounded-lg p-2 transition-colors hover:bg-muted"
                  >
                    <ChevronLeft className="h-5 w-5 text-primary" />
                  </button>
                  <h2 className="-ml-10 flex-1 text-center text-lg font-semibold text-foreground">
                    {currentCategory?.label}
                  </h2>
                </>
              ) : (
                <h2 className="text-lg font-semibold text-foreground">{labels.filters}</h2>
              )}
              <button
                type="button"
                onClick={closeSheet}
                className="-mr-2 rounded-lg p-2 transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {selectedCategory ? (
                <div className="py-2">
                  {currentCategory?.options.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-muted"
                    >
                      <div className="flex flex-1 items-center gap-3">
                        <span className="text-[15px] text-foreground">{option.value}</span>
                        {option.count !== undefined && (
                          <span className="text-sm text-muted-foreground">({option.count})</span>
                        )}
                      </div>
                      <Checkbox
                        checked={isFilterSelected(selectedCategory, option.value)}
                        onCheckedChange={() => handleFilterToggle(selectedCategory, option.value)}
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <div className="py-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => openCategorySheet(category.id)}
                      className="flex w-full items-center justify-between border-b border-border px-4 py-4 text-left last:border-0 transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] text-foreground">{category.label}</span>
                        {(selectedFilters[category.id]?.length ?? 0) > 0 && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                            {selectedFilters[category.id].length}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!selectedCategory && totalActiveFilters > 0 && (
              <div className="border-t border-border p-4">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="w-full rounded-lg border border-border py-3 font-medium text-primary transition-colors hover:bg-muted"
                >
                  {labels.clearFilters}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Active filters */}
      {totalActiveFilters > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{labels.activeFilters}</p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-sm text-primary hover:underline"
            >
              {labels.clearFilters}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(selectedFilters).map(([categoryId, filters]) =>
              filters.map((filter) => (
                <span
                  key={`${categoryId}-${filter}`}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                >
                  {filter}
                  <button
                    type="button"
                    onClick={() => handleFilterToggle(categoryId, filter)}
                    className="rounded-full p-0.5 hover:bg-white/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
