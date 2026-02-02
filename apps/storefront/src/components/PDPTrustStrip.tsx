import { Truck, RefreshCw, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PDPTrustStripProps {
  labels: {
    freeShipping: string;
    returns: string;
    securePayment: string;
  };
  className?: string;
}

export function PDPTrustStrip({ labels, className }: PDPTrustStripProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-4 border-t border-border pt-6",
        className
      )}
    >
      <div className="text-center">
        <Truck className="mx-auto mb-2 h-6 w-6 text-primary" aria-hidden />
        <p className="text-xs text-muted-foreground">{labels.freeShipping}</p>
      </div>
      <div className="text-center">
        <RefreshCw className="mx-auto mb-2 h-6 w-6 text-primary" aria-hidden />
        <p className="text-xs text-muted-foreground">{labels.returns}</p>
      </div>
      <div className="text-center">
        <Shield className="mx-auto mb-2 h-6 w-6 text-primary" aria-hidden />
        <p className="text-xs text-muted-foreground">{labels.securePayment}</p>
      </div>
    </div>
  );
}
