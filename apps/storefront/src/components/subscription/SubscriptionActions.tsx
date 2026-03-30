"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, Loader2 } from "lucide-react";
import { medusa } from "@/lib/medusa";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type SubscriptionActionsProps = {
  subscriptionId: string;
  status: string;
  skipNext?: boolean;
  deliveryCount: number;
  minimumCommitment?: number;
  locale: string;
  dict: {
    skipNext: string;
    pause: string;
    resume: string;
    cancel: string;
    viewDetails: string;
    cancelConfirm: string;
    cancelConfirmTitle: string;
    cancelAfter?: string;
    cancelKeepButton: string;
    cancelSubmitButton: string;
    cancelLoadingLabel: string;
    cancelSuccessTitle: string;
    cancelSuccessBody: string;
    cancelCloseButton: string;
    cancelTryAgain: string;
  };
  /** Hide link to full subscription page (e.g. when actions live inside detail panel). */
  showViewDetailsLink?: boolean;
  /** After a successful mutation: refetch panel, refresh list, etc. */
  onActionSuccess?: () => void | Promise<void>;
  /** `stacked`: full-width actions for sheet/dialog (matches account order CTA density). */
  layout?: "row" | "stacked";
};

export function SubscriptionActions({
  subscriptionId,
  status,
  skipNext = false,
  deliveryCount,
  minimumCommitment = 2,
  locale,
  dict,
  showViewDetailsLink = true,
  onActionSuccess,
  layout = "row",
}: SubscriptionActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelDialogSuccess, setCancelDialogSuccess] = useState(false);
  const [cancelDialogError, setCancelDialogError] = useState<string | null>(null);

  const canCancel = deliveryCount >= minimumCommitment;
  const cancelAfterText = dict.cancelAfter?.replace(
    "{{count}}",
    String(Math.max(0, minimumCommitment - deliveryCount))
  );

  const isStacked = layout === "stacked";
  const outlineBtn = cn(
    buttonVariants({ variant: "outline", size: "sm" }),
    isStacked && "w-full justify-center rounded-full px-5"
  );
  const primaryBtn = cn(
    buttonVariants({ variant: "default", size: "sm" }),
    isStacked && "w-full justify-center rounded-full px-5"
  );
  const destructiveBtn = cn(
    "text-sm font-medium text-destructive hover:text-destructive/90 disabled:opacity-50",
    isStacked && "w-full py-2 text-center"
  );

  const resetCancelDialog = useCallback(() => {
    setCancelSubmitting(false);
    setCancelDialogSuccess(false);
    setCancelDialogError(null);
  }, []);

  const handleCancelDialogOpenChange = (next: boolean) => {
    if (!next && cancelSubmitting) return;
    setCancelDialogOpen(next);
    if (!next) resetCancelDialog();
  };

  const performCancel = useCallback(async () => {
    setCancelSubmitting(true);
    setCancelDialogError(null);
    try {
      await medusa.client.fetch(
        `/store/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      setCancelSubmitting(false);
      setCancelDialogSuccess(true);
      await onActionSuccess?.();
      router.refresh();
    } catch (e) {
      setCancelSubmitting(false);
      setCancelDialogError(e instanceof Error ? e.message : "Something went wrong");
    }
  }, [onActionSuccess, router, subscriptionId]);

  async function callAction(action: "pause" | "resume" | "skip") {
    setLoading(action);
    setError(null);
    setSuccess(null);
    try {
      await medusa.client.fetch(
        `/store/subscriptions/${encodeURIComponent(subscriptionId)}/${action}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: action === "skip" ? { skip: true } : undefined,
        }
      );
      setSuccess(
        locale === "da"
          ? action === "skip"
            ? "Næste levering er sprunget over."
            : action === "pause"
              ? "Abonnementet er sat på pause."
              : "Abonnementet er genaktiveret."
          : action === "skip"
            ? "Next delivery has been skipped."
            : action === "pause"
              ? "Subscription has been paused."
              : "Subscription has been resumed."
      );
      await onActionSuccess?.();
      router.refresh();
      setLoading(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  }

  const actionBusy = !!loading;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4",
        isStacked && "flex-col items-stretch gap-3"
      )}
    >
      <Dialog open={cancelDialogOpen} onOpenChange={handleCancelDialogOpenChange}>
        <DialogContent
          showCloseButton={!cancelSubmitting}
          overlayClassName="z-[60] bg-black/40 supports-backdrop-filter:backdrop-blur-xs"
          className="z-[61] max-w-[calc(100%-2rem)] gap-0 rounded-2xl p-0 sm:max-w-md"
        >
          {cancelDialogSuccess ? (
            <>
              <div className="px-5 pt-6 pb-2">
                <div
                  className="flex flex-col items-center text-center"
                  aria-live="polite"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <CircleCheck className="h-7 w-7" strokeWidth={2} aria-hidden />
                  </span>
                  <DialogTitle className="mt-4 text-lg font-semibold">{dict.cancelSuccessTitle}</DialogTitle>
                  <DialogDescription className="mt-2 text-base text-muted-foreground">
                    {dict.cancelSuccessBody}
                  </DialogDescription>
                </div>
              </div>
              <div className="border-t border-border/80 bg-muted/30 px-5 py-4">
                <Button
                  type="button"
                  className="w-full rounded-full"
                  onClick={() => handleCancelDialogOpenChange(false)}
                >
                  {dict.cancelCloseButton}
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="px-5 pt-5 pb-2 text-left">
                <DialogTitle>{dict.cancelConfirmTitle}</DialogTitle>
                <DialogDescription className="text-left text-base">
                  {dict.cancelConfirm}
                </DialogDescription>
              </DialogHeader>
              {cancelDialogError ? (
                <p className="px-5 pb-2 text-sm text-destructive" role="alert">
                  {cancelDialogError}
                </p>
              ) : null}
              <div className="flex flex-col-reverse gap-2 border-t border-border/80 bg-muted/30 px-5 py-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full sm:w-auto"
                  disabled={cancelSubmitting}
                  onClick={() => handleCancelDialogOpenChange(false)}
                >
                  {dict.cancelKeepButton}
                </Button>
                {cancelDialogError ? (
                  <Button
                    type="button"
                    variant="default"
                    className="w-full rounded-full sm:w-auto"
                    disabled={cancelSubmitting}
                    onClick={() => void performCancel()}
                  >
                    {dict.cancelTryAgain}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full rounded-full sm:w-auto"
                    disabled={cancelSubmitting}
                    onClick={() => void performCancel()}
                  >
                    {cancelSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        {dict.cancelLoadingLabel}
                      </span>
                    ) : (
                      dict.cancelSubmitButton
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {showViewDetailsLink ? (
        <Link
          href={`/${locale}/account/subscriptions/${subscriptionId}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          {dict.viewDetails}
        </Link>
      ) : null}
      {status === "active" && (
        <>
          {!skipNext && (
            <button
              type="button"
              className={outlineBtn}
              onClick={() => void callAction("skip")}
              disabled={actionBusy}
            >
              {loading === "skip" ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  …
                </span>
              ) : (
                dict.skipNext
              )}
            </button>
          )}
          <button
            type="button"
            className={outlineBtn}
            onClick={() => void callAction("pause")}
            disabled={actionBusy}
          >
            {loading === "pause" ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                …
              </span>
            ) : (
              dict.pause
            )}
          </button>
        </>
      )}
      {status === "paused" && (
        <button
          type="button"
          className={primaryBtn}
          onClick={() => void callAction("resume")}
          disabled={actionBusy}
        >
          {loading === "resume" ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              …
            </span>
          ) : (
            dict.resume
          )}
        </button>
      )}
      {status === "active" && canCancel && (
        <button
          type="button"
          className={destructiveBtn}
          onClick={() => {
            resetCancelDialog();
            setCancelDialogOpen(true);
          }}
          disabled={actionBusy}
        >
          {dict.cancel}
        </button>
      )}
      {status === "active" && !canCancel && cancelAfterText && (
        <p className={cn("text-sm text-muted-foreground", isStacked && "text-center")}>
          {cancelAfterText}
        </p>
      )}
      {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
      {success && !error ? (
        <p className="w-full text-sm text-emerald-700 dark:text-emerald-400">{success}</p>
      ) : null}
    </div>
  );
}
