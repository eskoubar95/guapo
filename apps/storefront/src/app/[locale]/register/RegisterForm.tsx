"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { medusa } from "@/lib/medusa";
import { getSafeReturnUrl } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthLabels = {
  registerTitle: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  submitRegister: string;
  errorRegister: string;
};

interface RegisterFormProps {
  locale: string;
  labels: AuthLabels;
  /** When provided, called on success instead of navigating to account (e.g. for modal flow). */
  onSuccess?: () => void;
  /** After register, redirect here if valid (same-origin path). */
  returnUrl?: string;
}

export function RegisterForm({ locale, labels, onSuccess, returnUrl }: RegisterFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultDestination = `/${locale}/account`;
  const destination = getSafeReturnUrl(returnUrl, defaultDestination);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) return;
    setError(null);
    setLoading(true);
    try {
      let shouldCreateCustomer = true;
      try {
        await medusa.auth.register("customer", "emailpass", { email, password });
      } catch (err: unknown) {
        const fetchError = err as { status?: number; message?: string };
        if (
          fetchError.status !== 401 ||
          (fetchError.message && !fetchError.message.includes("already exists"))
        ) {
          setError(labels.errorRegister);
          setLoading(false);
          return;
        }
        const loginResult = await medusa.auth.login("customer", "emailpass", { email, password });
        if (typeof loginResult !== "string") {
          setError(labels.errorRegister);
          setLoading(false);
          return;
        }
        shouldCreateCustomer = false;
      }
      if (shouldCreateCustomer) {
        await medusa.store.customer.create({
          first_name: firstName,
          last_name: lastName,
          email,
        });
      }
      if (onSuccess) {
        onSuccess();
        router.refresh();
      } else {
        router.push(destination);
        router.refresh();
      }
    } catch {
      setError(labels.errorRegister);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="mt-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="register-first">{labels.firstName}</Label>
          <Input
            id="register-first"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="register-last">{labels.lastName}</Label>
          <Input
            id="register-last"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1"
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="register-email">{labels.email}</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor="register-password">{labels.password}</Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1"
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "..." : labels.submitRegister}
      </Button>
    </form>
  );
}
