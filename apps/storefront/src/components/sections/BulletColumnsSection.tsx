"use client";

const bgClassMap = {
  white: "bg-white",
  gray: "bg-muted",
  "brand-light": "bg-primary/5",
} as const;

export interface BulletColumnsSectionProps {
  heading?: string | null;
  columns: { columnHeading?: string | null; items?: { text: string }[] | null }[];
  backgroundColor?: "white" | "gray" | "brand-light" | null;
}

export function BulletColumnsSection({
  heading,
  columns,
  backgroundColor = "white",
}: BulletColumnsSectionProps) {
  const bgClass = bgClassMap[backgroundColor ?? "white"] ?? "bg-white";
  if (!columns?.length) return null;

  return (
    <section className={`py-8 sm:py-10 lg:py-14 ${bgClass}`}>
      <div className="section-container">
        {heading && (
          <h2 className="section-heading text-text-primary mb-6 lg:mb-8 text-left">
            {heading}
          </h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10 text-left">
          {columns.map((col, i) => (
            <div key={i} className="flex flex-col">
              {col.columnHeading && (
                <h3 className="text-lg font-semibold text-text-primary mb-3">
                  {col.columnHeading}
                </h3>
              )}
              <ul className="list-disc pl-5 space-y-2 text-text-muted">
                {(col.items ?? []).map((item, j) => (
                  <li key={j}>{item.text}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
