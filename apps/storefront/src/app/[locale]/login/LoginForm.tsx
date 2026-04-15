"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { medusa } from "@/lib/medusa";
import { getCurrentReturnUrl, getSafeReturnUrl } from "@/lib/auth-utils";
import { trackUserLoggedIn } from "@/lib/analytics/posthog-ecommerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthLabels = {
  loginTitle: string;
  email: string;
  password: string;
  submitLogin: string;
  loginWithGoogle: string;
  errorLogin: string;
  noAccount: string;
  registerLink: string;
  orDivider: string;
};

interface LoginFormProps {
  locale: string;
  labels: AuthLabels;
  /** When provided, called on success instead of navigating to account (e.g. for modal flow). */
  onSuccess?: () => void;
  /** After login, redirect here if valid (same-origin path). */
  returnUrl?: string;
}

export function LoginForm({ locale, labels, onSuccess, returnUrl }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const defaultDestination = `/${locale}/account`;
  const destination = getSafeReturnUrl(returnUrl, defaultDestination);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setStatusMessage(locale === "da" ? "Logger ind..." : "Signing in...");
    setLoading(true);
    try {
      const result = await medusa.auth.login("customer", "emailpass", { email, password });
      if (typeof result === "object" && "location" in result) {
        setError(labels.errorLogin);
        return;
      }
      if (typeof result !== "string") {
        setError(labels.errorLogin);
        return;
      }
      trackUserLoggedIn({ method: "emailpass" });
      if (onSuccess) {
        setStatusMessage(locale === "da" ? "Opdaterer..." : "Updating...");
        onSuccess();
        router.refresh();
      } else {
        setStatusMessage(locale === "da" ? "Viderestiller..." : "Redirecting...");
        router.push(destination);
        router.refresh();
      }
    } catch {
      setError(labels.errorLogin);
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setStatusMessage(locale === "da" ? "Forbinder til Google..." : "Connecting to Google...");
    setGoogleLoading(true);
    try {
      const baseCallback = typeof window !== "undefined" ? `${window.location.origin}/${locale}/auth/google/callback` : "";
      const currentReturnUrl = returnUrl || getCurrentReturnUrl(`/${locale}/account`);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("guapo_google_return_url", currentReturnUrl);
      }
      const result = await medusa.auth.login("customer", "google", baseCallback ? { callback_url: baseCallback } : {});
      if (typeof result === "object" && result.location) {
        setStatusMessage(locale === "da" ? "Viderestiller til Google..." : "Redirecting to Google...");
        window.location.href = result.location;
        return;
      }
      if (typeof result === "string") {
        trackUserLoggedIn({ method: "google" });
        if (onSuccess) {
          onSuccess();
          router.refresh();
        } else {
          router.push(destination);
          router.refresh();
        }
        return;
      }
      setError(labels.errorLogin);
    } catch {
      setError(labels.errorLogin);
    } finally {
      setGoogleLoading(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <Label htmlFor="login-email">{labels.email}</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="login-password">{labels.password}</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {statusMessage && !error && (
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            {statusMessage}
          </p>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (locale === "da" ? "Logger ind..." : "Signing in...") : labels.submitLogin}
        </Button>
      </form>

      <div className="relative">
        <span className="bg-background relative z-10 flex justify-center px-2 text-sm text-muted-foreground">
          {labels.orDivider}
        </span>
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={googleLoading}
        onClick={handleGoogleLogin}
      >
        {googleLoading ? (locale === "da" ? "Forbinder..." : "Connecting...") : labels.loginWithGoogle}
      </Button>
    </div>
  );
}
