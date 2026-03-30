"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface NewsletterFormProps {
  locale: string;
  placeholder?: string;
  submitLabel?: string;
  /** Layout: "inline" = input + button row; "stacked" = full width stacked (e.g. centered section) */
  layout?: "inline" | "stacked";
  className?: string;
}

const defaultPlaceholder = "Din email";
const defaultSubmitLabel = "Tilmeld";

export function NewsletterForm({
  locale,
  placeholder = defaultPlaceholder,
  submitLabel = defaultSubmitLabel,
  layout = "inline",
  className,
}: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      toast.error(
        locale === "da" ? "Udfyld din e-mailadresse" : "Please enter your email address"
      );
      return;
    }
    if (!acceptPrivacy) {
      toast.error(
        locale === "da"
          ? "Du skal acceptere privatlivspolitikken"
          : "You must accept the privacy policy"
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, acceptPrivacy: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          locale === "da" ? data?.error ?? "Noget gik galt" : data?.error ?? "Something went wrong"
        );
        return;
      }
      toast.success(
        locale === "da" ? "Tak – du er tilmeldt nyhedsbrevet" : "Thanks – you're subscribed"
      );
      setEmail("");
      setAcceptPrivacy(false);
    } catch {
      toast.error(locale === "da" ? "Noget gik galt" : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStacked = layout === "stacked";
  const privacyDescId = useId();

  return (
    <form
      onSubmit={handleSubmit}
      className={className}
      noValidate
    >
      <div
        className={
          isStacked
            ? "flex flex-col gap-3"
            : "flex flex-col sm:flex-row gap-2 sm:gap-3"
        }
      >
        <Input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          required
          className={isStacked ? "w-full" : "flex-1 min-w-0"}
          aria-label={placeholder}
        />
        <Button
          type="submit"
          className="shrink-0 w-full sm:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? locale === "da"
              ? "Tilmelder…"
              : "Subscribing…"
            : submitLabel}
        </Button>
      </div>
      <label className="mt-3 flex items-start gap-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={acceptPrivacy}
          onChange={(e) => setAcceptPrivacy(e.target.checked)}
          className="mt-0.5 rounded border-border"
          aria-describedby={privacyDescId}
        />
        <span
          id={privacyDescId}
          className="text-sm text-text-muted"
        >
          {locale === "da" ? (
            <>
              Jeg accepterer{" "}
              <Link
                href={`/${locale}/policies/privacy`}
                className="text-primary hover:underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                privatlivspolitikken
              </Link>
              .
            </>
          ) : (
            <>
              I accept the{" "}
              <Link
                href={`/${locale}/policies/privacy`}
                className="text-primary hover:underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                privacy policy
              </Link>
              .
            </>
          )}
        </span>
      </label>
    </form>
  );
}
