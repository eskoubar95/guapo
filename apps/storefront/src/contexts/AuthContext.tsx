"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { medusa } from "@/lib/medusa";

type Customer = { id: string; email?: string | null; first_name?: string | null; last_name?: string | null; [k: string]: unknown };

type AuthState = {
  customer: Customer | null;
  loading: boolean;
  isAuthenticated: boolean;
  refetch: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const requestVersionRef = useRef(0);

  const refetch = useCallback(async () => {
    const requestVersion = ++requestVersionRef.current;
    setLoading(true);
    try {
      const { customer: c } = await medusa.store.customer.retrieve();
      if (requestVersion === requestVersionRef.current) {
        setCustomer((c ?? null) as unknown as Customer | null);
      }
    } catch {
      if (requestVersion === requestVersionRef.current) {
        setCustomer(null);
      }
    } finally {
      if (requestVersion === requestVersionRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    requestVersionRef.current += 1;
    try {
      await medusa.auth.logout();
    } finally {
      setCustomer(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const value: AuthState = {
    customer,
    loading,
    isAuthenticated: !!customer,
    refetch,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
