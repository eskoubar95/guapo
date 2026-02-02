import { Droplet, Shield, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KeyIngredientItem {
  name: string;
  description: string;
  icon?: "droplet" | "shield" | "sparkles" | "users";
}

const iconMap = {
  droplet: Droplet,
  shield: Shield,
  sparkles: Sparkles,
  users: Users,
};

const defaultIconColors: Record<keyof typeof iconMap, { bg: string; text: string }> = {
  droplet: { bg: "bg-info/15", text: "text-info" },
  shield: { bg: "bg-warning/15", text: "text-warning" },
  sparkles: { bg: "bg-success/15", text: "text-success" },
  users: { bg: "bg-primary/15", text: "text-primary" },
};

export interface KeyInformationCardProps {
  ingredients: KeyIngredientItem[];
  skinType: string;
  benefits: string;
  ingredientsLabel: string;
  skinTypeLabel: string;
  benefitsLabel: string;
  className?: string;
}

export function KeyInformationCard({
  ingredients,
  skinType,
  benefits,
  ingredientsLabel,
  skinTypeLabel,
  benefitsLabel,
  className,
}: KeyInformationCardProps) {
  const icons: (keyof typeof iconMap)[] = ["droplet", "shield", "sparkles", "users"];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Key ingredients */}
      {ingredients.length > 0 && (
        <div className="rounded-lg bg-muted/50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-foreground">{ingredientsLabel}</h4>
          <div className="grid grid-cols-2 gap-3">
            {ingredients.map((ingredient, index) => {
              const iconKey = ingredient.icon ?? icons[index % icons.length];
              const Icon = iconMap[iconKey];
              const colors = defaultIconColors[iconKey];
              return (
                <div key={index} className="flex items-start gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      colors.bg,
                      colors.text
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{ingredient.name}</p>
                    <p className="text-xs text-muted-foreground">{ingredient.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skin type + Benefits */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">{skinTypeLabel}</h4>
          </div>
          <p className="text-xs text-muted-foreground">{skinType}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
              <Sparkles className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">{benefitsLabel}</h4>
          </div>
          <p className="text-xs text-muted-foreground">{benefits}</p>
        </div>
      </div>
    </div>
  );
}
