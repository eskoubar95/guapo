"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/app/[locale]/login/LoginForm";
import { RegisterForm } from "@/app/[locale]/register/RegisterForm";

const EXIT_DURATION_MS = 200;

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export type AuthModalView = "login" | "register";

export interface AuthModalLabels {
  loginTitle: string;
  registerTitle: string;
  closeLabel: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  submitLogin: string;
  submitRegister: string;
  loginWithGoogle: string;
  errorLogin: string;
  errorRegister: string;
  noAccount: string;
  hasAccount: string;
  registerLink: string;
  loginLink: string;
  orDivider: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  labels: AuthModalLabels;
  initialView?: AuthModalView;
  /** After login/register success, navigate here (e.g. checkout). */
  returnUrl?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  locale,
  labels,
  initialView = "login",
  returnUrl,
}: AuthModalProps) {
  const { refetch } = useAuth();
  const [view, setView] = useState<AuthModalView>(initialView);
  const [exiting, setExiting] = useState(false);
  const [animatedOpen, setAnimatedOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) setView(initialView);
  }, [isOpen, initialView]);

  useEffect(() => {
    if (!isOpen) {
      setExiting(false);
      setAnimatedOpen(false);
      return;
    }
    setAnimatedOpen(false);
    const raf = requestAnimationFrame(() => setAnimatedOpen(true));
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setAnimatedOpen(false);
  }, [exiting]);

  useEffect(() => {
    if (isOpen || exiting) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen, exiting]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !exiting) handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, exiting, handleClose]);

  useEffect(() => {
    if (!exiting) return;
    const t = setTimeout(() => onClose(), EXIT_DURATION_MS);
    return () => clearTimeout(t);
  }, [exiting, onClose]);

  // Focus trap: save focus on open, move to first focusable
  useEffect(() => {
    if (!isOpen || exiting) return;
    previousActiveElement.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      const first = modalRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (first) first.focus();
      else modalRef.current?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [isOpen, exiting]);

  // Restore focus only after modal is fully closed (not when exit animation starts)
  useEffect(() => {
    if (isOpen || exiting) return;
    previousActiveElement.current?.focus?.();
    previousActiveElement.current = null;
  }, [isOpen, exiting]);

  // Keep Tab/Shift+Tab inside modal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Tab" || !modalRef.current) return;
      const focusables = Array.from(modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    []
  );

  const handleSuccess = () => {
    refetch();
    onClose();
  };

  if (!isOpen && !exiting) return null;

  const overlayClasses = [
    "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ease-out",
    animatedOpen && !exiting ? "opacity-100" : "opacity-0",
  ]
    .filter(Boolean)
    .join(" ");

  const panelClasses = [
    "relative w-full max-w-md bg-background rounded-xl shadow-xl border border-border overflow-hidden",
    "transition-[transform,opacity] duration-200 ease-out",
    animatedOpen && !exiting ? "scale-100 opacity-100" : "scale-[0.96] opacity-0",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <div
      className="fixed inset-0 z-100 overflow-hidden"
      aria-hidden={exiting}
    >
      <div
        className={overlayClasses}
        onClick={handleClose}
        aria-hidden
      />
      <div className="relative flex items-center justify-center min-h-full p-4">
        <div
          ref={modalRef}
          className={panelClasses}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h2 id="auth-modal-title" className="text-xl font-semibold text-foreground">
              {view === "login" ? labels.loginTitle : labels.registerTitle}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label={labels.closeLabel}
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <div className="px-6 pb-6">
            {view === "login" ? (
              <>
                <LoginForm
                  locale={locale}
                  returnUrl={returnUrl}
                  labels={{
                    loginTitle: labels.loginTitle,
                    email: labels.email,
                    password: labels.password,
                    submitLogin: labels.submitLogin,
                    loginWithGoogle: labels.loginWithGoogle,
                    errorLogin: labels.errorLogin,
                    noAccount: labels.noAccount,
                    registerLink: labels.registerLink,
                    orDivider: labels.orDivider,
                  }}
                  onSuccess={handleSuccess}
                />
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  {labels.noAccount}{" "}
                  <button
                    type="button"
                    onClick={() => setView("register")}
                    className="font-medium text-primary hover:underline"
                  >
                    {labels.registerLink}
                  </button>
                </p>
              </>
            ) : (
              <>
                <RegisterForm
                  locale={locale}
                  returnUrl={returnUrl}
                  labels={{
                    registerTitle: labels.registerTitle,
                    email: labels.email,
                    password: labels.password,
                    firstName: labels.firstName,
                    lastName: labels.lastName,
                    submitRegister: labels.submitRegister,
                    errorRegister: labels.errorRegister,
                  }}
                  onSuccess={handleSuccess}
                />
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  {labels.hasAccount}{" "}
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="font-medium text-primary hover:underline"
                  >
                    {labels.loginLink}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return content;
  return createPortal(content, document.body);
}
