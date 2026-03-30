"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { medusa } from "@/lib/medusa";
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
  /** After success, navigate here (e.g. return to checkout). */
  returnUrl?: string;
}

export function LoginForm({ locale, labels, onSuccess, returnUrl }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
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
      if (onSuccess) {
        onSuccess();
      }
      if (returnUrl) {
        router.push(returnUrl);
      } else if (!onSuccess) {
        router.push(`/${locale}/account`);
      }
      router.refresh();
    } catch {
      setError(labels.errorLogin);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const callbackUrl = typeof window !== "undefined" ? `${window.location.origin}/${locale}/auth/google/callback` : "";
      const result = await medusa.auth.login("customer", "google", callbackUrl ? { callback_url: callbackUrl } : {});
      if (typeof result === "object" && result.location) {
        window.location.href = result.location;
        return;
      }
      if (typeof result === "string") {
        if (onSuccess) {
          onSuccess();
        }
        if (returnUrl) {
          router.push(returnUrl);
        } else if (!onSuccess) {
          router.push(`/${locale}/account`);
        }
        router.refresh();
        return;
      }
      setError(labels.errorLogin);
    } catch {
      setError(labels.errorLogin);
    } finally {
      setGoogleLoading(false);
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
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "..." : labels.submitLogin}
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
        {googleLoading ? "..." : labels.loginWithGoogle}
      </Button>
    </div>
  );
}
