import { Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ServiceItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface ServiceStripProps {
  services?: ServiceItem[];
  backgroundColor?: string;
}

const defaultServices: ServiceItem[] = [
  {
    icon: Truck,
    title: "Hurtig levering",
    description: "Fri fragt over 299 kr. Levering 1-3 hverdage",
  },
  {
    icon: ShieldCheck,
    title: "Sikker betaling",
    description: "Krypteret betaling og databeskyttelse",
  },
  {
    icon: RotateCcw,
    title: "30 dages returret",
    description: "Nem og gratis returnering",
  },
  {
    icon: Headphones,
    title: "Kundeservice",
    description: "Vi hjælper dig alle hverdage 9-17",
  },
];

export function ServiceStrip({
  services = defaultServices,
  backgroundColor = "bg-surface-muted/30",
}: ServiceStripProps) {
  return (
    <section className={`py-8 lg:py-10 ${backgroundColor}`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-4 bg-card rounded-xl border border-border"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground text-sm mb-1">
                  {service.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
