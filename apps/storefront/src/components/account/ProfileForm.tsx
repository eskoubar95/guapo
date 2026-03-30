"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { medusa } from "@/lib/medusa";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

interface ProfileFormLabels {
  profileTitle: string;
  profileSaved: string;
  profileError: string;
  saving: string;
  save: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ProfileFormProps {
  labels: ProfileFormLabels;
}

export function ProfileForm({ labels }: ProfileFormProps) {
  const { customer, refetch } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    if (!customer) return;
    setFirstName(customer.first_name ?? "");
    setLastName(customer.last_name ?? "");
    setPhone((customer.phone as string) ?? "");
  }, [customer]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await medusa.store.customer.update({
        first_name: firstName,
        last_name: lastName,
        phone,
      });
      await refetch();
      setFeedback({ type: "success", msg: labels.profileSaved });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ type: "error", msg: labels.profileError });
    } finally {
      setSaving(false);
    }
  };

  if (!customer) return null;

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">{labels.profileTitle}</h2>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-email">{labels.email}</Label>
            <Input
              id="profile-email"
              type="email"
              value={customer.email ?? ""}
              disabled
              className="bg-muted/50 cursor-not-allowed"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-firstName">{labels.firstName}</Label>
              <Input
                id="profile-firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-lastName">{labels.lastName}</Label>
              <Input
                id="profile-lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-phone">{labels.phone}</Label>
            <Input
              id="profile-phone"
              type="tel"
              placeholder="+45"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {saving ? labels.saving : labels.save}
            </button>

            {feedback && (
              <span
                role={feedback.type === "error" ? "alert" : "status"}
                aria-live={feedback.type === "error" ? "assertive" : "polite"}
                aria-atomic="true"
                className={`inline-flex items-center gap-1.5 text-sm font-medium ${feedback.type === "success" ? "text-success" : "text-destructive"}`}
              >
                {feedback.type === "success" && <Check className="h-4 w-4" aria-hidden />}
                {feedback.msg}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
