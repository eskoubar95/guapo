"use client";

import { NewsletterForm } from "@/components/NewsletterForm";

export interface NewsletterProps {
  title: string;
  description: string;
  placeholder: string;
  submitLabel: string;
  locale: string;
}

export function Newsletter({
  title,
  description,
  placeholder,
  submitLabel,
  locale,
}: NewsletterProps) {
  return (
    <section id="newsletter" className="py-8 sm:py-10 lg:py-12 bg-white">
      <div className="section-container min-w-0">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="section-heading text-primary mb-2">
            {title}
          </h2>
          <p className="text-text-muted mb-6 text-sm">
            {description}
          </p>
          <div className="text-left">
            <NewsletterForm
              locale={locale}
              placeholder={placeholder}
              submitLabel={submitLabel}
              layout="stacked"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
