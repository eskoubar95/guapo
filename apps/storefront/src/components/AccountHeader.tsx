"use client"

import { LogOut } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"

interface AccountHeaderProps {
  locale: string
  title: string
  signOutLabel: string
}

export function AccountHeader({ locale, title, signOutLabel }: AccountHeaderProps) {
  const { customer, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut({ redirectTo: `/${locale}/login` })
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
        variant="destructive"
        size="sm"
        className="mt-1 w-full gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:mt-0 sm:w-auto sm:self-start"
        onClick={handleSignOut}
      >
        <LogOut className="size-3.5 shrink-0 opacity-95" aria-hidden />
        {signOutLabel}
      </Button>
    </div>
  )
}
