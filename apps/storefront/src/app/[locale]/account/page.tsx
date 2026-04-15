import { getDictionary } from "@/i18n/dictionaries"
import type { Locale } from "@/i18n/config"
import type { Metadata } from "next"
import { AccountHeader } from "@/components/AccountHeader"
import { AccountOverviewClient } from "@/components/account/AccountOverviewClient"

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

  return (
    <div className="max-w-3xl">
      <AccountHeader
        locale={locale}
        title={dict.account.title}
        signOutLabel={dict.account.signOut}
      />
      <AccountOverviewClient locale={locale} />
    </div>
  )
}
