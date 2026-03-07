"use client";

import Link from "next/link";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import type { NavMenuItem, NavDropdownItem } from "@/lib/payload-navigation";

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  menuItems: NavMenuItem[];
}

export function SidebarMenu({ isOpen, onClose, locale, menuItems }: SidebarMenuProps) {
  const [activeDropdown, setActiveDropdown] = useState<NavDropdownItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setActiveDropdown(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const base = `/${locale}`;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-50 transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-full md:w-[380px] bg-background z-50 overflow-hidden shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full overflow-y-auto flex flex-col">
          {!activeDropdown ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
                <Link
                  href={base}
                  onClick={onClose}
                  className="shrink-0"
                  aria-label="Guapo – forside"
                >
                  <img
                    src="/logos/GUAPO_default.svg"
                    alt="Guapo"
                    className="h-6 w-auto"
                    width={856}
                    height={157}
                  />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 hover:bg-surface rounded-lg transition-colors"
                  aria-label="Luk menu"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Menu Items (from CMS) */}
              <nav className="flex-1 py-2">
                {menuItems.map((item, index) => {
                  if (item.type === "dropdown") {
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setActiveDropdown(item)}
                        className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-surface transition-colors group"
                      >
                        <span className="font-medium text-primary group-hover:opacity-80">
                          {item.label}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    );
                  }
                  return (
                    <Link
                      key={index}
                      href={item.href}
                      onClick={onClose}
                      {...(item.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="flex items-center justify-between px-6 py-3.5 hover:bg-surface transition-colors group"
                    >
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </>
          ) : (
            <>
              {/* Dropdown submenu header */}
              <div className="flex items-center justify-between px-4 py-5 border-b border-border flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(null)}
                  className="p-2 hover:bg-surface rounded-lg transition-colors -ml-2"
                  aria-label="Tilbage"
                >
                  <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                </button>
                <h2 className="font-semibold text-primary text-base">
                  {activeDropdown.label}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 hover:bg-surface rounded-lg transition-colors -mr-2"
                  aria-label="Luk menu"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Dropdown children */}
              <div className="flex-1 py-4 overflow-y-auto">
                <div className="space-y-1">
                  {activeDropdown.children.map((child, i) => (
                    <Link
                      key={i}
                      href={child.href}
                      onClick={onClose}
                      {...(child.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="flex items-center justify-between px-6 py-2.5 hover:bg-surface transition-colors group"
                    >
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                        {child.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
