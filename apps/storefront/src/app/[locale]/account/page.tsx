import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

interface AccountPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AccountPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Min konto" : "My Account",
    robots: { index: false },
  };
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  const navItems = [
    { href: `/${locale}/account/orders`, label: dict.account.orders, description: locale === "da" ? "Se dine tidligere ordrer" : "View your past orders" },
    { href: `/${locale}/account/subscriptions`, label: dict.account.subscriptions, description: locale === "da" ? "Administrer dine abonnementer" : "Manage your subscriptions" },
    { href: `/${locale}/account/profile`, label: dict.account.profile, description: locale === "da" ? "Opdater dine oplysninger" : "Update your information" },
    { href: `/${locale}/account/addresses`, label: dict.account.addresses, description: locale === "da" ? "Administrer dine adresser" : "Manage your addresses" },
  ];

  return (
    <div className="min-h-full">
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{dict.account.title}</h1>
          <button type="button" className="text-sm text-muted-foreground hover:text-primary">
            {dict.account.signOut}
          </button>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Card className="border-border bg-surface">
            <CardContent className="p-4">
              <p className="text-2xl font-semibold text-foreground">3</p>
              <p className="text-sm text-muted-foreground">{locale === "da" ? "Ordrer i år" : "Orders this year"}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-surface">
            <CardContent className="p-4">
              <p className="text-2xl font-semibold text-foreground">1</p>
              <p className="text-sm text-muted-foreground">{locale === "da" ? "Aktive abonnementer" : "Active subscriptions"}</p>
            </CardContent>
          </Card>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="h-full border-border bg-card transition-colors hover:border-primary hover:bg-surface">
                <CardContent className="p-4">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <Card className="mt-8 border-success/30 bg-success/5">
          <CardContent className="p-4">
            <p className="font-medium text-foreground">{locale === "da" ? "Næste levering" : "Next delivery"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Niacinamide Serum - {new Date("2026-02-12").toLocaleDateString(locale === "da" ? "da-DK" : "en-US", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <Link href={`/${locale}/account/subscriptions`} className="mt-2 inline-flex text-sm font-medium text-primary hover:underline">
              {locale === "da" ? "Administrer →" : "Manage →"}
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
