import { getDictionary } from "@/i18n/dictionaries"
import type { Locale } from "@/i18n/config"
import Link from "next/link"
import type { Metadata } from "next"
import { ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { AccountHeader } from "@/components/AccountHeader"

interface AccountPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: AccountPageProps): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "da" ? "Min konto" : "My Account",
    robots: { index: false },
  }
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const isDa = locale === "da"

  const navItems = [
    { href: `/${locale}/account/orders`, label: dict.account.orders, description: isDa ? "Se dine tidligere ordrer" : "View your past orders" },
    { href: `/${locale}/account/subscriptions`, label: dict.account.subscriptions, description: isDa ? "Administrer dine abonnementer" : "Manage your subscriptions" },
    { href: `/${locale}/account/profile`, label: dict.account.profile, description: isDa ? "Opdater dine oplysninger" : "Update your information" },
    { href: `/${locale}/account/addresses`, label: dict.account.addresses, description: isDa ? "Administrer dine adresser" : "Manage your addresses" },
  ]

  const nextDeliveryDate = new Date("2026-02-12").toLocaleDateString(isDa ? "da-DK" : "en-US", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="max-w-3xl">
      <AccountHeader
        locale={locale}
        title={dict.account.title}
        signOutLabel={dict.account.signOut}
      />
      {/* Stats: 1 col on xs, 2 from sm */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 sm:mt-8">
        <Card className="border-border bg-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-2xl sm:text-3xl font-semibold tabular-nums text-foreground">3</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{isDa ? "Ordrer i år" : "Orders this year"}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-2xl sm:text-3xl font-semibold tabular-nums text-foreground">1</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{isDa ? "Aktive abonnementer" : "Active subscriptions"}</p>
          </CardContent>
        </Card>
      </div>
      {/* Action cards: full width on mobile, 2 cols from sm */}
      <div className="mt-6 grid gap-3 sm:gap-4 sm:grid-cols-2 sm:mt-8">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl">
            <Card className="h-full border-border bg-card transition-colors hover:border-primary/50 hover:bg-muted/30">
              <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="mt-6 sm:mt-8 border-primary/20 bg-primary/5">
        <CardContent className="p-4 sm:p-5">
          <p className="font-medium text-foreground">{isDa ? "Næste levering" : "Next delivery"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Niacinamide Serum – {nextDeliveryDate}
          </p>
          <Link
            href={`/${locale}/account/subscriptions`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {isDa ? "Administrer" : "Manage"}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
