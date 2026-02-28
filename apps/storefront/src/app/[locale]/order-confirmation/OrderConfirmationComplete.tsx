"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { medusa } from "@/lib/medusa";
import { clearCartId } from "@/lib/cart";

interface OrderConfirmationCompleteProps {
  locale: string;
  cartId: string | undefined;
  dict: {
    confirming: string;
    errorMessage: string;
    backToCheckout: string;
  };
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

  useEffect(() => {
    if (!cartId) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    medusa.store.cart
      .complete(cartId)
      .then(async (res) => {
        if (cancelled) return;
        if (res.type === "order" && "order" in res && res.order?.id) {
          await clearCartId();
          setStatus("success");
          router.replace(`/${locale}/order-confirmation/${res.order.id}`);
        } else {
          setStatus("error");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to complete cart:", err);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [cartId, locale, router]);

  if (status === "loading") {
    return (
      <div className="min-h-full">
        <main className="container mx-auto max-w-2xl px-4 py-8 text-center">
          <p className="text-muted-foreground">{dict.confirming}</p>
        </main>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-full">
        <main className="container mx-auto max-w-2xl px-4 py-8 text-center">
          <p className="text-destructive">{dict.errorMessage}</p>
          <Link
            href={`/${locale}/checkout`}
            className="mt-4 inline-block text-primary hover:underline"
          >
            {dict.backToCheckout}
          </Link>
        </main>
      </div>
    );
  }

  return null;
}
