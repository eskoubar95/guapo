"use client";

import Link from "next/link";
import {
  X,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  Tag,
  Sparkles,
  ShoppingBag,
  FileText,
  Home,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { NavSection, NavMenuItem, NavDropdownItem } from "@/lib/payload-navigation";

const ICON_MAP: Record<string, LucideIcon> = {
  grid: LayoutGrid,
  tag: Tag,
  sparkles: Sparkles,
  "shopping-bag": ShoppingBag,
  "file-text": FileText,
  home: Home,
};

const iconClass = "h-5 w-5 shrink-0 text-text-muted";

/** Render icon from Payload choice; none or unknown = no icon. */
function MenuItemIcon({ icon }: { icon?: string | null }) {
  if (!icon || icon === "none") return null;
  const Icon = ICON_MAP[icon];
  if (!Icon) return null;
  return <Icon className={iconClass} aria-hidden />;
}

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  sections: NavSection[];
}

/** Item row: same hover on flat and card so it breaks against both sidebar gray and white. */
const itemClass =
  "flex items-center justify-between gap-3 w-full px-4 py-4 text-left border-b border-sidebar-divider last:border-b-0 hover:bg-sidebar-item-hover active:bg-sidebar-item-hover transition-colors min-h-[48px]";

export function SidebarMenu({ isOpen, onClose, locale, sections }: SidebarMenuProps) {
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

      {/* Sidebar — solid gray background (surface) */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-full md:w-[380px] bg-surface z-50 overflow-hidden shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full overflow-y-auto flex flex-col">
          {!activeDropdown ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-sidebar-divider shrink-0">
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
                  className="p-2.5 hover:bg-sidebar-item-hover rounded-lg transition-colors -mr-1"
                  aria-label="Luk menu"
                >
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              {/* Menu sections — card = white box with rounded corners; flat = directly on sidebar background */}
              <nav className="flex-1 px-4 py-4 space-y-4" aria-label="Navigation">
                {sections.map((section, sectionIndex) => {
                  const isFlat = section.sectionStyle === "flat";
                  const itemList = (
                    <>
                      {section.items.map((item, index) => {
                        if (item.type === "dropdown") {
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setActiveDropdown(item)}
                              className={itemClass}
                            >
                              <span className="flex items-center gap-3 min-w-0">
                                <MenuItemIcon icon={item.icon} />
                                <span className="font-medium text-text-primary truncate">
                                  {item.label}
                                </span>
                              </span>
                              <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" aria-hidden />
                            </button>
                          );
                        }
                        return (
                          <Link
                            key={index}
                            href={item.href}
                            onClick={onClose}
                            {...(item.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                            className={itemClass}
                          >
                            <span className="flex items-center gap-3 min-w-0">
                              <MenuItemIcon icon={item.icon} />
                              <span className="font-medium text-text-primary truncate">
                                {item.label}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </>
                  );
                  return (
                    <div key={sectionIndex}>
                      {section.title ? (
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted px-1 mb-2">
                          {section.title}
                        </h2>
                      ) : null}
                      {isFlat ? (
                        <div className="overflow-hidden">{itemList}</div>
                      ) : (
                        <div className="rounded-xl bg-white overflow-hidden">
                          {itemList}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </>
          ) : (
            <>
              {/* Submenu header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-divider shrink-0 bg-surface-muted/30">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(null)}
                  className="p-2.5 hover:bg-surface rounded-lg transition-colors -ml-1"
                  aria-label="Tilbage"
                >
                  <ChevronLeft className="h-5 w-5 text-text-muted" />
                </button>
                <h2 className="font-semibold text-text-primary text-base truncate mx-2">
                  {activeDropdown.label}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2.5 hover:bg-sidebar-item-hover rounded-lg transition-colors -mr-1"
                  aria-label="Luk menu"
                >
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              {/* Submenu children — leaf links, no chevron; wrapped in white canvas */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="rounded-xl bg-white overflow-hidden">
                  {activeDropdown.children.map((child, i) => (
                    <Link
                      key={i}
                      href={child.href}
                      onClick={onClose}
                      {...(child.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="flex items-center w-full px-4 py-3.5 text-left border-b border-sidebar-divider last:border-b-0 hover:bg-sidebar-item-hover active:bg-sidebar-item-hover transition-colors min-h-[44px] font-medium text-text-primary"
                    >
                      {child.label}
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
