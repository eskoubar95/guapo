import {
  fetchProductReviews,
  fetchProductReviewStats,
  type ProductReviewItem,
  type ProductReviewStats,
} from "@/lib/medusa-product-reviews";
import { formatReviewerDisplayName } from "@/lib/review-display-name";
import { Star } from "lucide-react";
import { ProductReviewFormBlock } from "./ProductReviewFormBlock";

export interface ProductReviewsSectionLabels {
  title: string;
  count: string;
  count_plural: string;
  noReviews: string;
  ratingLabel: string;
  responseLabel: string;
  writeReview: string;
  writeReviewTitle: string;
  headline: string;
  headlinePlaceholder: string;
  reviewText: string;
  reviewTextPlaceholder: string;
  submitReview: string;
  loginToReview: string;
  loginLink: string;
  wasHelpful: string;
  yes: string;
  no: string;
  submitting: string;
  errorSubmit: string;
  successSubmit: string;
}

interface ProductReviewsSectionProps {
  productId: string;
  locale: string;
  labels: ProductReviewsSectionLabels;
}

function Stars({ rating, locale, size = "md" }: { rating: number; locale: string; size?: "sm" | "md" | "lg" }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const ariaLabel =
    locale === "da" ? `${rating} ud af 5 stjerner` : `${rating} out of 5 stars`;
  const sizeClass = size === "lg" ? "h-6 w-6" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5" aria-label={ariaLabel}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i <= full ? "fill-primary text-primary" : i === full + 1 && half ? "fill-primary/50 text-primary" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function StarDistributionBar({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 min-w-[60px] flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
    </div>
  );
}

function ReviewCard({
  review,
  responseLabel,
  locale,
}: {
  review: ProductReviewItem;
  responseLabel: string;
  locale: string;
}) {
  const displayName = formatReviewerDisplayName(review.name, locale);
  const date = review.created_at
    ? new Date(review.created_at).toLocaleDateString(locale === "da" ? "da-DK" : "en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const content = review.content ?? "";
  const headlineMatch = content.indexOf("\n\n") >= 0;
  const headline = headlineMatch ? content.slice(0, content.indexOf("\n\n")).trim() : "";
  const body = headlineMatch ? content.slice(content.indexOf("\n\n") + 2).trim() : content;

  return (
    <article className="border-b border-border py-4 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <Stars rating={review.rating} locale={locale} size="sm" />
        {date && (
          <time className="text-sm text-muted-foreground" dateTime={review.created_at}>
            {date}
          </time>
        )}
      </div>
      <p className="mt-1 font-medium text-foreground">{displayName}</p>
      {headline && <p className="mt-1 font-medium text-foreground">{headline}</p>}
      {body && <p className="mt-2 text-sm text-muted-foreground">{body}</p>}
      {review.response?.content && (
        <div className="mt-3 rounded-md bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground">{responseLabel}</p>
          <p className="mt-1 text-sm text-foreground">{review.response.content}</p>
        </div>
      )}
    </article>
  );
}

export async function ProductReviewsSection({
  productId,
  locale,
  labels,
}: ProductReviewsSectionProps) {
  const [statsResult, reviewsResult] = await Promise.allSettled([
    fetchProductReviewStats(productId),
    fetchProductReviews(productId, 20, 0),
  ]);

  const stats = statsResult.status === "fulfilled" ? statsResult.value : null;
  const { reviews, count } =
    reviewsResult.status === "fulfilled"
      ? reviewsResult.value
      : { reviews: [] as ProductReviewItem[], count: 0 };

  const countText =
    count === 1
      ? labels.count.replace("{{count}}", String(count))
      : labels.count_plural.replace("{{count}}", String(count));

  const hasStats = stats != null && stats.review_count > 0;
  const totalForBars =
    stats != null
      ? (stats.rating_count_1 ?? 0) +
        (stats.rating_count_2 ?? 0) +
        (stats.rating_count_3 ?? 0) +
        (stats.rating_count_4 ?? 0) +
        (stats.rating_count_5 ?? 0)
      : 0;

  return (
    <section className="mt-10 border-t border-border pt-8" aria-labelledby="reviews-heading">
      <h2
        id="reviews-heading"
        className="text-2xl font-semibold tracking-tight text-foreground"
      >
        {labels.title}
      </h2>

      <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start lg:gap-8">
        {/* Left: rating overview + star distribution + write review CTA */}
        <div className="order-2 space-y-4 lg:order-none">
          {hasStats && stats && (
            <>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-foreground">
                  {stats.average_rating?.toFixed(1) ?? "0"}
                </span>
                <div className="flex flex-col">
                  <Stars rating={stats.average_rating ?? 0} locale={locale} size="lg" />
                  <span className="mt-1 text-sm text-muted-foreground">{countText}</span>
                </div>
              </div>
              {totalForBars > 0 && (
                <div className="space-y-2">
                  {([5, 4, 3, 2, 1] as const).map((star) => {
                    const key = `rating_count_${star}` as keyof ProductReviewStats;
                    const count = (stats[key] as number | undefined) ?? 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="w-4 text-xs text-muted-foreground">{star}</span>
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        <StarDistributionBar count={count} total={totalForBars} />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
          <div className="pt-2">
            <ProductReviewFormBlock
              productId={productId}
              locale={locale}
              labels={{
                writeReview: labels.writeReview,
                writeReviewTitle: labels.writeReviewTitle,
                ratingLabel: labels.ratingLabel,
                headline: labels.headline,
                headlinePlaceholder: labels.headlinePlaceholder,
                reviewText: labels.reviewText,
                reviewTextPlaceholder: labels.reviewTextPlaceholder,
                submitReview: labels.submitReview,
                loginToReview: labels.loginToReview,
                loginLink: labels.loginLink,
                submitting: labels.submitting,
                errorSubmit: labels.errorSubmit,
                successSubmit: labels.successSubmit,
              }}
            />
          </div>
        </div>

        {/* Right: review list (first on mobile) */}
        <div className="order-1 lg:order-none">
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">{labels.noReviews}</p>
          ) : (
            <div>
              {reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  responseLabel={labels.responseLabel}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
