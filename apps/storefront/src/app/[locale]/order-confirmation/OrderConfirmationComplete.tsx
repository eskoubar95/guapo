"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { medusa } from "@/lib/medusa";

interface OrderConfirmationCompleteProps {
  locale: string;
  cartId: string | undefined;
  dict: Record<string, string>;
}

export function OrderConfirmationComplete({
  locale,
  cartId,
  dict,
}: OrderConfirmationCompleteProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    cartId ? "loading" : "error"
  );
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!cartId) {
      setStatus("error");
      return;
    }
    medusa.store.cart
      .complete(cartId)
      .then((res) => {
        if (res.type === "order" && "order" in res && res.order?.id) {
          setOrderId(res.order.id);
          setStatus("success");
          router.replace(`/${locale}/order-confirmation/${res.order.id}`);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [cartId, locale, router]);

  if (status === "loading") {
    return (
      <div className="min-h-full">
        <main className="container mx-auto max-w-2xl px-4 py-8 text-center">
          <p className="text-muted-foreground">
            {locale === "da" ? "Bekræfter ordre..." : "Confirming order..."}
          </p>
        </main>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-full">
        <main className="container mx-auto max-w-2xl px-4 py-8 text-center">
          <p className="text-destructive">
            {locale === "da"
              ? "Kunne ikke bekræfte ordren."
              : "Could not confirm order."}
          </p>
          <Link
            href={`/${locale}/checkout`}
            className="mt-4 inline-block text-primary hover:underline"
          >
            {locale === "da" ? "Tilbage til checkout" : "Back to checkout"}
          </Link>
        </main>
      </div>
    );
  }

  return null;
}
