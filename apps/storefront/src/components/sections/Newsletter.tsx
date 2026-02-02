"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NewsletterProps {
  title: string;
  description: string;
  placeholder: string;
  submitLabel: string;
}

export function Newsletter({
  title,
  description,
  placeholder,
  submitLabel,
}: NewsletterProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to CMS/email provider
  };

  return (
    <section id="newsletter" className="py-10 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-primary mb-2">
            {title}
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">
            {description}
          </p>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              required
              className="flex-1 px-4 py-3 bg-input-background border-2 border-border rounded-lg focus:border-primary focus:outline-none text-foreground text-sm"
              aria-label={placeholder}
            />
            <Button type="submit" className="shrink-0">
              {submitLabel}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
