import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

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
    subtitle: "Vi vil gerne høre fra dig. Send os en besked, så vender vi tilbage hurtigst muligt.",
    form: {
      title: "Send en besked",
      firstName: "Fornavn",
      lastName: "Efternavn",
      email: "E-mail",
      subject: "Emne",
      subjectPlaceholder: "Hvad drejer det sig om?",
      message: "Besked",
      messagePlaceholder: "Skriv din besked her...",
      submit: "Send besked",
    },
    contactInfo: {
      email: "E-mail",
      emailValue: "kontakt@guapo.dk",
      phone: "Telefon",
      phoneValue: "+45 12 34 56 78",
      address: "Adresse",
      addressValue: "Guapo ApS, Vesterbrogade 123, 1620 København",
      hours: "Åbningstider",
      hoursValue: "Man-Fre: 9:00 - 17:00\nLør-Søn: Lukket",
    },
  } : {
    title: "Contact Us",
    subtitle: "We'd love to hear from you. Send us a message and we'll get back to you as soon as possible.",
    form: {
      title: "Send a message",
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      subject: "Subject",
      subjectPlaceholder: "What is this regarding?",
      message: "Message",
      messagePlaceholder: "Write your message here...",
      submit: "Send message",
    },
    contactInfo: {
      email: "Email",
      emailValue: "contact@guapo.dk",
      phone: "Phone",
      phoneValue: "+45 12 34 56 78",
      address: "Address",
      addressValue: "Guapo ApS, Vesterbrogade 123, 1620 Copenhagen",
      hours: "Opening hours",
      hoursValue: "Mon-Fri: 9:00 - 17:00\nSat-Sun: Closed",
    },
  };

  const info = content.contactInfo;

  return (
    <div className="min-h-full">
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground">{content.title}</h1>
        <p className="mt-4 text-muted-foreground">{content.subtitle}</p>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {/* Contact form (design: fornavn, efternavn, email, emne, besked) */}
          <div className="rounded-lg border border-border bg-card p-8 lg:col-span-2">
            <h2 className="text-lg font-semibold text-foreground">{content.form.title}</h2>
            <form className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{content.form.firstName}</Label>
                  <Input id="firstName" name="firstName" placeholder={content.form.firstName} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{content.form.lastName}</Label>
                  <Input id="lastName" name="lastName" placeholder={content.form.lastName} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{content.form.email}</Label>
                <Input id="email" name="email" type="email" placeholder="din@email.dk" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">{content.form.subject}</Label>
                <Input id="subject" name="subject" placeholder={content.form.subjectPlaceholder} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">{content.form.message}</Label>
                <Textarea id="message" name="message" rows={6} placeholder={content.form.messagePlaceholder} required />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {content.form.submit}
              </button>
            </form>
          </div>

          {/* Contact info: Mail, Phone, MapPin, Clock (design 1:1) */}
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-medium text-foreground">{info.email}</h3>
                  <a href={`mailto:${info.emailValue}`} className="text-sm text-muted-foreground hover:text-primary">
                    {info.emailValue}
                  </a>
                </div>
              </div>
              <div className="mb-4 flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-medium text-foreground">{info.phone}</h3>
                  <p className="text-sm text-muted-foreground">{info.phoneValue}</p>
                </div>
              </div>
              <div className="mb-4 flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-medium text-foreground">{info.address}</h3>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{info.addressValue}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-medium text-foreground">{info.hours}</h3>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{info.hoursValue}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
