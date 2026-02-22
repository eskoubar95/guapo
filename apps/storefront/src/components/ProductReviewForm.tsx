"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import Link from "next/link";

interface ProductReviewFormProps {
  productId: string;
  locale: string;
  labels: {
    writeReviewTitle: string;
    headline: string;
    headlinePlaceholder: string;
    reviewText: string;
    reviewTextPlaceholder: string;
    submitReview: string;
    loginToReview: string;
    loginLink: string;
    submitting: string;
    errorSubmit: string;
    successSubmit: string;
  };
  onSuccess?: () => void;
}

export function ProductReviewForm({
  productId,
  locale,
  labels,
  onSuccess,
}: ProductReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [headline, setHeadline] = useState("");
  const [content, setContent] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const displayRating = hoverRating || rating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || !content.trim()) return;
    setStatus("submitting");
    setErrorCode(null);
    try {
      const res = await fetch("/api/product-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          rating,
          content: content.trim(),
          ...(headline.trim() && { headline: headline.trim() }),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setRating(0);
        setHeadline("");
        setContent("");
        setTimeout(() => onSuccess?.(), 2000);
      } else if (res.status === 401) {
        setStatus("error");
        setErrorCode("UNAUTHORIZED");
      } else {
        setStatus("error");
        setErrorCode(data?.code ?? "UNKNOWN");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">{labels.writeReviewTitle}</h3>

      {/* Star rating */}
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">{labels.reviewText}</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              className="rounded p-1 transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`${value} stjerner`}
            >
              <Star
                className={`h-8 w-8 ${
                  value <= displayRating ? "fill-primary text-primary" : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="review-headline" className="mb-1 block text-sm font-medium text-foreground">
          {labels.headline}
        </label>
        <input
          id="review-headline"
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder={labels.headlinePlaceholder}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          maxLength={200}
        />
      </div>

      <div>
        <label htmlFor="review-content" className="mb-1 block text-sm font-medium text-foreground">
          {labels.reviewText} <span className="text-destructive">*</span>
        </label>
        <textarea
          id="review-content"
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={labels.reviewTextPlaceholder}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          maxLength={5000}
        />
      </div>

      {status === "error" && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {errorCode === "UNAUTHORIZED" ? (
            <>
              {labels.loginToReview}{" "}
              <Link
                href={`/${locale}/account`}
                className="font-medium underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {labels.loginLink}
              </Link>
            </>
          ) : (
            labels.errorSubmit
          )}
        </div>
      )}

      {status === "success" && (
        <p className="text-sm text-green-700 dark:text-green-400">{labels.successSubmit}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting" || rating < 1 || !content.trim()}
        className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
      >
        {status === "submitting" ? labels.submitting : labels.submitReview}
      </button>
    </form>
  );
}
