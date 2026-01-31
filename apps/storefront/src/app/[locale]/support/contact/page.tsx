import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";

interface SupportPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SupportPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Kontakt os" : "Contact Us",
  };
}

export default async function ContactPage({ params }: SupportPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  const content = locale === "da" ? {
    title: "Kontakt os",
    subtitle: "Vi er her for at hjælpe. Vælg den måde der passer dig bedst.",
    email: {
      title: "E-mail",
      description: "Skriv til os på",
      address: "support@guapo.dk",
      response: "Vi svarer normalt inden for 24 timer på hverdage.",
    },
    phone: {
      title: "Telefon",
      description: "Ring til os på",
      number: "+45 XX XX XX XX",
      hours: "Man-Fre: 09:00 - 17:00",
    },
    form: {
      title: "Send en besked",
      name: "Navn",
      email: "E-mail",
      orderNumber: "Ordrenummer (valgfrit)",
      subject: "Emne",
      subjectOptions: [
        "Generelt spørgsmål",
        "Ordre forespørgsel",
        "Returnering",
        "Abonnement",
        "Produktspørgsmål",
        "Andet",
      ],
      message: "Besked",
      submit: "Send besked",
    },
    faq: {
      title: "Tjek vores FAQ",
      description: "Måske finder du svaret i vores ofte stillede spørgsmål.",
      link: "Gå til FAQ",
    },
  } : {
    title: "Contact Us",
    subtitle: "We're here to help. Choose the way that suits you best.",
    email: {
      title: "Email",
      description: "Write to us at",
      address: "support@guapo.dk",
      response: "We usually respond within 24 hours on business days.",
    },
    phone: {
      title: "Phone",
      description: "Call us at",
      number: "+45 XX XX XX XX",
      hours: "Mon-Fri: 09:00 - 17:00",
    },
    form: {
      title: "Send a message",
      name: "Name",
      email: "Email",
      orderNumber: "Order number (optional)",
      subject: "Subject",
      subjectOptions: [
        "General question",
        "Order inquiry",
        "Return",
        "Subscription",
        "Product question",
        "Other",
      ],
      message: "Message",
      submit: "Send message",
    },
    faq: {
      title: "Check our FAQ",
      description: "You might find the answer in our frequently asked questions.",
      link: "Go to FAQ",
    },
  };

  return (
    <div className="min-h-full">
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">{content.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{content.subtitle}</p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* Contact methods */}
          <div className="space-y-8">
            {/* Email */}
            <div className="rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground">{content.email.title}</h2>
              <p className="mt-2 text-muted-foreground">{content.email.description}</p>
              <a
                href={`mailto:${content.email.address}`}
                className="mt-2 block text-lg font-medium text-foreground hover:text-muted-foreground"
              >
                {content.email.address}
              </a>
              <p className="mt-2 text-sm text-muted-foreground">{content.email.response}</p>
            </div>

            {/* Phone */}
            <div className="rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground">{content.phone.title}</h2>
              <p className="mt-2 text-muted-foreground">{content.phone.description}</p>
              <p className="mt-2 text-lg font-medium text-foreground">{content.phone.number}</p>
              <p className="mt-2 text-sm text-muted-foreground">{content.phone.hours}</p>
            </div>

            {/* FAQ link */}
            <div className="rounded-lg bg-surface p-6">
              <h2 className="text-lg font-semibold text-foreground">{content.faq.title}</h2>
              <p className="mt-2 text-muted-foreground">{content.faq.description}</p>
              <Link
                href={`/${locale}/support/faq`}
                className="mt-4 inline-flex text-sm font-medium text-foreground hover:text-muted-foreground"
              >
                {content.faq.link} →
              </Link>
            </div>
          </div>

          {/* Contact form */}
          <div className="rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground">{content.form.title}</h2>
            <form className="mt-6 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                  {content.form.name}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  {content.form.email}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="orderNumber" className="block text-sm font-medium text-foreground">
                  {content.form.orderNumber}
                </label>
                <input
                  type="text"
                  id="orderNumber"
                  name="orderNumber"
                  className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-foreground">
                  {content.form.subject}
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                >
                  {content.form.subjectOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground">
                  {content.form.message}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:border-2 focus-visible:border-primary focus-visible:outline-none"
              >
                {content.form.submit}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
