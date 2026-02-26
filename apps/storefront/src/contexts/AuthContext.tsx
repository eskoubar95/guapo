"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { medusa } from "@/lib/medusa";

type Customer = { id: string; email?: string | null; first_name?: string | null; last_name?: string | null; [k: string]: unknown };

type AuthState = {
  customer: Customer | null;
  loading: boolean;
  isAuthenticated: boolean;
  refetch: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const { customer: c } = await medusa.store.customer.retrieve();
      setCustomer((c ?? null) as unknown as Customer | null);
    } catch {
      setCustomer(null);
    } finally {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      customer: null,
      loading: true,
      isAuthenticated: false,
      refetch: async () => {},
    };
  }
  return ctx;
}
