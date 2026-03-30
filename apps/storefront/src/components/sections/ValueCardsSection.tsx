"use client";

const bgClassMap = {
  white: "bg-white",
  gray: "bg-muted",
  "brand-light": "bg-primary/5",
} as const;

export interface ValueCardsSectionProps {
  heading?: string | null;
  cards: { title: string; body: string }[];
  backgroundColor?: "white" | "gray" | "brand-light" | null;
}

export function ValueCardsSection({
  heading,
  cards,
  backgroundColor = "white",
}: ValueCardsSectionProps) {
  const bgClass = bgClassMap[backgroundColor ?? "white"] ?? "bg-white";
  if (!cards?.length) return null;

  return (
    <section className={`py-8 sm:py-10 lg:py-14 ${bgClass}`}>
      <div className="section-container">
        {heading && (
          <h2 className="section-heading text-text-primary mb-6 lg:mb-8 text-left">
            {heading}
          </h2>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8 text-left">
          {cards.map((card, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-text-primary mb-3">
                {card.title}
              </h3>
              <div className="prose prose-neutral max-w-none text-text-muted prose-p:mb-2 prose-p:last:mb-0 text-sm">
                {card.body.split("\n").map((para, j) => (
                  <p key={j}>{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
