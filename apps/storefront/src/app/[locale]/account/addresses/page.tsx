import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";
import { AddressManager } from "@/components/account/AddressManager";

interface AddressPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AddressPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Adresser – Min konto" : "Addresses – My Account",
    robots: { index: false },
  };
}

export default async function AddressPage({ params }: AddressPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="max-w-2xl">
      <AddressManager
        locale={locale}
        labels={{
          addressTitle: dict.account.addressTitle,
          billingAddress: dict.account.billingAddress,
          address: dict.account.address,
          postalCode: dict.account.postalCode,
          city: dict.account.city,
          addressSaved: dict.account.addressSaved,
          addressError: dict.account.addressError,
          preferredPickupPoint: dict.account.preferredPickupPoint,
          noPickupPointSaved: dict.account.noPickupPointSaved,
          searchPickupPoint: dict.account.searchPickupPoint,
          pickupPointSaved: dict.account.pickupPointSaved,
          pickupPointError: dict.account.pickupPointError,
          saving: dict.account.saving,
          save: dict.account.save,
          change: dict.account.change,
          firstName: dict.account.firstName,
          lastName: dict.account.lastName,
        }}
      />
    </div>
  );
}
