"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function SearchModal({ isOpen, onClose, locale }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex items-start justify-center pt-16 md:pt-24 px-4">
        <div
          className="relative w-full max-w-2xl bg-background rounded-2xl shadow-2xl overflow-hidden border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 px-6 py-5 border-b border-border"
          >
            <Search className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="search"
              placeholder="Søg efter produkter, brands eller hudproblemer..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-foreground placeholder:text-muted-foreground bg-transparent border-0 focus:outline-none text-base"
              aria-label="Søg"
            />
            <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-1 bg-surface border border-border rounded text-xs font-medium text-muted-foreground">
              ⌘K
            </kbd>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-surface rounded-lg transition-colors"
              aria-label="Luk søgning"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </form>
          <div className="p-4 text-center text-sm text-muted-foreground">
            Tryk Enter for at søge
          </div>
        </div>
      </div>
    </div>
  );
}
