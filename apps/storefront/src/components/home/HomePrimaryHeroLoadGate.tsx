"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

type GateContextValue = { notifyPrimaryHeroMediaReady: () => void };

const HomePrimaryHeroLoadContext = createContext<GateContextValue | null>(null);

const GATE_TIMEOUT_MS = 12_000;

export function useNotifyPrimaryHeroMediaReady(): (() => void) | undefined {
  return useContext(HomePrimaryHeroLoadContext)?.notifyPrimaryHeroMediaReady;
}

interface HomePrimaryHeroLoadGateProps {
  /** When true, full-viewport skeleton until primary hero image signals ready (or timeout). */
  blockUntilPrimaryHeroMedia: boolean;
  children: ReactNode;
}

export function HomePrimaryHeroLoadGate({
  blockUntilPrimaryHeroMedia,
  children,
}: HomePrimaryHeroLoadGateProps) {
  const pathname = usePathname();
  const [released, setReleased] = useState(!blockUntilPrimaryHeroMedia);
  const releasedRef = useRef(released);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  const notify = useCallback(() => {
    if (releasedRef.current) return;
    releasedRef.current = true;
    setReleased(true);
  }, []);

  useLayoutEffect(() => {
    releasedRef.current = !blockUntilPrimaryHeroMedia;
    setReleased(!blockUntilPrimaryHeroMedia);
  }, [blockUntilPrimaryHeroMedia]);

  useLayoutEffect(() => {
    if (!blockUntilPrimaryHeroMedia) return;
    const id = window.setTimeout(() => notify(), GATE_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [blockUntilPrimaryHeroMedia, notify]);

  const value = useMemo(() => ({ notifyPrimaryHeroMediaReady: notify }), [notify]);

  return (
    <HomePrimaryHeroLoadContext.Provider value={value}>
      {!released && (
        <div
          className="fixed inset-0 z-[200] flex flex-col bg-background"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="flex min-h-[min(420px,85svh)] w-full flex-col justify-end gap-4 p-6 pb-12 sm:p-10 lg:min-h-[420px]">
            <Skeleton className="h-10 w-4/5 max-w-xl" />
            <Skeleton className="h-6 w-3/5 max-w-lg" />
            <Skeleton className="mt-4 h-12 w-40 rounded-lg" />
          </div>
        </div>
      )}
      {children}
    </HomePrimaryHeroLoadContext.Provider>
  );
}
