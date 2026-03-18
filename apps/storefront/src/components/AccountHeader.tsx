"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"

interface AccountHeaderProps {
  locale: string
  title: string
  signOutLabel: string
}

export function AccountHeader({ locale, title, signOutLabel }: AccountHeaderProps) {
  const router = useRouter();
  const { customer, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut()
    router.replace(`/${locale}/login`)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-foreground sm:text-2xl sm:font-bold">{title}</h1>
        {customer?.email && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{customer.email}</p>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit mt-1 sm:mt-0"
        onClick={handleSignOut}
      >
        {signOutLabel}
      </Button>
    </div>
  )
}
