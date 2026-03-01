"use client";

import { useState } from "react";
import Link from "next/link";

const MEDUSA_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
).replace(/\/$/, "");

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
  };
};

export function SubscriptionActions({
  subscriptionId,
  status,
  skipNext = false,
  deliveryCount,
  minimumCommitment = 2,
  locale,
  dict,
}: SubscriptionActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCancel = deliveryCount >= minimumCommitment;
  const cancelAfterText = dict.cancelAfter?.replace(
    "{{count}}",
    String(Math.max(0, minimumCommitment - deliveryCount))
  );

  async function callAction(action: "pause" | "resume" | "skip" | "cancel") {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch(
        `${MEDUSA_URL}/store/subscriptions/${subscriptionId}/${action}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: action === "skip" ? JSON.stringify({ skip: true }) : undefined,
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? `Failed to ${action}`);
      }
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(null);
    }
  }

  const handleCancel = () => {
    if (window.confirm(dict.cancelConfirm || "Are you sure?")) {
      callAction("cancel");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Link
        href={`/${locale}/account/subscriptions/${subscriptionId}`}
        className="text-sm font-medium text-primary hover:underline"
      >
        {dict.viewDetails}
      </Link>
      {status === "active" && (
        <>
          {!skipNext && (
            <button
              type="button"
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              onClick={() => callAction("skip")}
              disabled={!!loading}
            >
              {loading === "skip" ? "..." : dict.skipNext}
            </button>
          )}
          <button
            type="button"
            className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            onClick={() => callAction("pause")}
            disabled={!!loading}
          >
            {loading === "pause" ? "..." : dict.pause}
          </button>
        </>
      )}
      {status === "paused" && (
        <button
          type="button"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          onClick={() => callAction("resume")}
          disabled={!!loading}
        >
          {loading === "resume" ? "..." : dict.resume}
        </button>
      )}
      {status === "active" && canCancel && (
        <button
          type="button"
          className="text-sm font-medium text-destructive hover:text-destructive/90 disabled:opacity-50"
          onClick={handleCancel}
          disabled={!!loading}
        >
          {loading === "cancel" ? "..." : dict.cancel}
        </button>
      )}
      {status === "active" && !canCancel && cancelAfterText && (
        <p className="text-sm text-muted-foreground">{cancelAfterText}</p>
      )}
      {error && (
        <p className="w-full text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
