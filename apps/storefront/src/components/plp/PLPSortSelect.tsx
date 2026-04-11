"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface PLPSortSelectProps {
  locale: string;
  currentSort: string;
  dictSort: string;
  options: { value: string; label: string }[];
}

export function PLPSortSelect({ currentSort, dictSort, options }: PLPSortSelectProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "featured") {
      next.delete("sort");
    } else {
      next.set("sort", value);
    }
    const q = next.toString();
    router.replace(`${pathname}${q ? `?${q}` : ""}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-muted-foreground hidden sm:block">{dictSort}:</label>
      <select
        value={currentSort}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-lg border-2 border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none w-40 sm:w-48"
        aria-label={dictSort}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
