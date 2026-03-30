import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { AccountLayout } from "@/components/AccountLayout";
import { AccountGate } from "@/components/AccountGate";

/**
 * Account layout: auth is enforced client-side via AccountGate (JWT in client/localStorage).
 * Server-side redirect would require cookie-based session; not used in this stack.
 */
interface AccountLayoutWrapperProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AccountLayoutWrapper({
  children,
  params,
}: AccountLayoutWrapperProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <AccountLayout
      locale={locale}
      labels={{
        accountTitle: dict.account.title,
        overview: dict.account.overview,
        orders: dict.account.orders,
        subscriptions: dict.account.subscriptions,
        profile: dict.account.profile,
        addresses: dict.account.addresses,
        loading: dict.account.loading,
      }}
    >
      <AccountGate locale={locale} loadingLabel={dict.account.loading}>
        {children}
      </AccountGate>
    </AccountLayout>
  );
}
