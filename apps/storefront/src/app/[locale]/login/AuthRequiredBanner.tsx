"use client";

interface AuthRequiredBannerProps {
  message: string;
}

export function AuthRequiredBanner({ message }: AuthRequiredBannerProps) {
  return (
    <div
      className="mt-4 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
