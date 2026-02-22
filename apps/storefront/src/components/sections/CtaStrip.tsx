import Link from "next/link";
import { Repeat, Gift, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CtaItem {
  icon?: LucideIcon;
  title: string;
  description?: string;
  href: string;
}

interface CtaStripProps {
  items?: CtaItem[];
  locale: string;
  backgroundColor?: string;
}

const defaultItems: CtaItem[] = [
  {
    icon: Repeat,
    title: "Opret abonnement",
    description: "Spar 20% på dine favoritter",
    href: "/account/subscriptions",
  },
  {
    icon: Gift,
    title: "Køb gavekort",
    description: "Den perfekte gave til hudplejeelskeren",
    href: "/categories/gavekort",
  },
  {
    icon: Mail,
    title: "Tilmeld nyhedsbrev",
    description: "Få 10% rabat på første ordre",
    href: "#newsletter",
  },
];

export function CtaStrip({
  items = defaultItems,
  locale,
  backgroundColor = "bg-background",
}: CtaStripProps) {
  return (
    <section className={`py-8 lg:py-10 ${backgroundColor}`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {items.map((item, index) => {
            const Icon = item.icon;
            const href =
              item.href.startsWith("#") ? item.href : `/${locale}${item.href}`;
            const isAnchor = item.href.startsWith("#");
            return (
              <Link
                key={index}
                href={href}
                className="bg-gradient-to-br from-slate-50 to-sky-50/30 rounded-xl p-6 lg:p-8 border border-border hover:shadow-md transition-all"
              >
                {Icon && (
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                )}
                <h3 className="font-semibold text-primary text-lg mb-2">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
