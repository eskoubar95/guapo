import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";
import { ProfileForm } from "@/components/account/ProfileForm";

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Profil – Min konto" : "Profile – My Account",
    robots: { index: false },
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="max-w-2xl">
      <ProfileForm
        labels={{
          profileTitle: dict.account.profileTitle,
          profileSaved: dict.account.profileSaved,
          profileError: dict.account.profileError,
          saving: dict.account.saving,
          save: dict.account.save,
          firstName: dict.account.firstName,
          lastName: dict.account.lastName,
          email: dict.account.email,
          phone: dict.account.phone,
        }}
      />
    </div>
  );
}
