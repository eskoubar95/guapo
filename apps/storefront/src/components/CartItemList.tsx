"use client";

import { useCallback, useMemo, useState } from "react";
import { CartItemCard } from "@/components/CartItemCard";

export interface CartItemInput {
  id: string;
  name: string;
  variant?: string;
  price: number;
  quantity: number;
  image: string | null;
  subscription: { cycle: number } | null;
}

interface CartItemListProps {
  items: CartItemInput[];
  locale: string;
  removeLabel: string;
  oneTimeLabel: string;
  subscribeLabel: string;
}

export function CartItemList({
  items,
  locale,
  removeLabel,
  oneTimeLabel,
  subscribeLabel,
}: CartItemListProps) {
  const [subscriptionById, setSubscriptionById] = useState<Record<string, { cycle: number } | null>>(() => {
    const initial: Record<string, { cycle: number } | null> = {};
    items.forEach((item) => {
      initial[item.id] = item.subscription;
    });
    return initial;
  });

  const onSubscriptionChange = useCallback((id: string, isSubscription: boolean) => {
    setSubscriptionById((prev) => ({
      ...prev,
      [id]: isSubscription ? { cycle: 8 } : null,
    }));
  }, []);

  const itemList = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        subscription: subscriptionById[item.id] ?? item.subscription,
      })),
    [items, subscriptionById]
  );

  return (
    <ul className="space-y-4">
      {itemList.map((item) => (
        <li key={item.id}>
          <CartItemCard
            id={item.id}
            name={item.name}
            price={item.price}
            image={item.image}
            quantity={item.quantity}
            size={item.variant}
            subscription={item.subscription}
            locale={locale}
            removeLabel={removeLabel}
            oneTimeLabel={oneTimeLabel}
            subscribeLabel={subscribeLabel}
            onSubscriptionChange={onSubscriptionChange}
          />
        </li>
      ))}
    </ul>
  );
}
