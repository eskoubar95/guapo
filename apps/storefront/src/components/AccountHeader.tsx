"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface AccountHeaderProps {
  locale: string;
  title: string;
  signOutLabel: string;
}

export function AccountHeader({ locale, title, signOutLabel }: AccountHeaderProps) {
  const router = useRouter();
  const { customer, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace(`/${locale}/login`);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {customer?.email && (
          <p className="mt-1 text-sm text-muted-foreground">{customer.email}</p>
        )}
      </div>
      <Button type="button" variant="ghost" size="sm" className="mt-2 sm:mt-0" onClick={handleSignOut}>
        {signOutLabel}
      </Button>
    </div>
  );
}
