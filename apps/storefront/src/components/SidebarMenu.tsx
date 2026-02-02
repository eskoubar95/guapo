"use client";

import Link from "next/link";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";

type MenuItemType = "category" | "link" | "section-header";

interface SubmenuCategory {
  name: string;
  href: string;
}

interface SubmenuSection {
  title: string;
  items: SubmenuCategory[];
}

interface SubmenuData {
  title: string;
  viewAllHref: string;
  categories: SubmenuCategory[];
  sections?: SubmenuSection[];
}

interface MenuItem {
  name: string;
  href?: string;
  type: MenuItemType;
  icon?: React.ComponentType<{ className?: string }>;
  hasSubmenu?: boolean;
  submenu?: SubmenuData;
}

const mainMenuItems: MenuItem[] = [
  {
    name: "Hudpleje",
    type: "category",
    hasSubmenu: true,
    submenu: {
      title: "Hudpleje",
      viewAllHref: "/categories/hudpleje",
      categories: [
        { name: "Rensning", href: "/categories/rensning" },
        { name: "Serum", href: "/categories/serum" },
        { name: "Fugtighedscreme", href: "/categories/creme" },
        { name: "Øjenpleje", href: "/categories/ojenpleje" },
        { name: "Solbeskyttelse", href: "/categories/solbeskyttelse" },
      ],
      sections: [
        {
          title: "Shop efter behov",
          items: [
            { name: "Tør hud", href: "/concerns/tor-hud" },
            { name: "Uren hud & Acne", href: "/concerns/uren-hud" },
            { name: "Følsom hud", href: "/concerns/folsom-hud" },
          ],
        },
      ],
    },
  },
  {
    name: "Makeup",
    type: "category",
    hasSubmenu: true,
    submenu: {
      title: "Makeup",
      viewAllHref: "/categories/makeup",
      categories: [
        { name: "Foundation", href: "/categories/foundation" },
        { name: "Læbestift", href: "/categories/labestift" },
        { name: "Mascara", href: "/categories/mascara" },
      ],
    },
  },
  {
    name: "Hår",
    type: "category",
    hasSubmenu: true,
    submenu: {
      title: "Hår",
      viewAllHref: "/categories/har",
      categories: [
        { name: "Shampoo", href: "/categories/shampoo" },
        { name: "Conditioner", href: "/categories/conditioner" },
        { name: "Styling", href: "/categories/styling" },
      ],
    },
  },
  {
    name: "Krop",
    type: "category",
    hasSubmenu: true,
    submenu: {
      title: "Krop",
      viewAllHref: "/categories/krop",
      categories: [
        { name: "Body Lotion", href: "/categories/lotion" },
        { name: "Body Wash", href: "/categories/wash" },
      ],
    },
  },
  { name: "Brands", href: "/brands", type: "link" },
  { name: "Nyheder", href: "/categories", type: "link" },
  { name: "Tilbud", href: "/categories", type: "link" },
  { name: "Bestsellers", href: "/categories", type: "link" },
  { name: "Inspiration", type: "section-header" },
  { name: "Blog & Guides", href: "/blog", type: "link" },
  { name: "Kundeservice", type: "section-header" },
  { name: "Mine ordrer", href: "/account/orders", type: "link" },
  { name: "FAQ", href: "/support/faq", type: "link" },
  { name: "Kontakt os", href: "/support/contact", type: "link" },
];

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function SidebarMenu({ isOpen, onClose, locale }: SidebarMenuProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<SubmenuData | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setActiveSubmenu(null);
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
          {!activeSubmenu ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
                <Link
                  href={base}
                  onClick={onClose}
                  className="font-semibold text-lg text-primary"
                >
                  Guapo
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

              {/* Menu Items */}
              <nav className="flex-1 py-2">
                {mainMenuItems.map((item, index) => {
                  if (item.type === "section-header") {
                    return (
                      <div
                        key={index}
                        className="px-6 pt-6 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        {item.name}
                      </div>
                    );
                  }

                  if (item.type === "category" && item.hasSubmenu && item.submenu) {
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setActiveSubmenu(item.submenu!)}
                        className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-surface transition-colors group"
                      >
                        <span className="font-medium text-primary group-hover:opacity-80">
                          {item.name}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={index}
                      href={`${base}${item.href ?? ""}`}
                      onClick={onClose}
                      className="flex items-center justify-between px-6 py-3.5 hover:bg-surface transition-colors group"
                    >
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </>
          ) : (
            <>
              {/* Submenu Header */}
              <div className="flex items-center justify-between px-4 py-5 border-b border-border flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveSubmenu(null)}
                  className="p-2 hover:bg-surface rounded-lg transition-colors -ml-2"
                  aria-label="Tilbage"
                >
                  <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                </button>
                <h2 className="font-semibold text-primary text-base">
                  {activeSubmenu.title}
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

              {/* Submenu Content */}
              <div className="flex-1 py-4 overflow-y-auto">
                <Link
                  href={`${base}${activeSubmenu.viewAllHref}`}
                  onClick={onClose}
                  className="mx-4 mb-4 px-4 py-3 bg-gradient-to-r from-[#DBE9F4] to-[#C8E6D4] rounded-lg hover:shadow-md transition-all block group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary">
                      Se alle produkter
                    </span>
                    <ChevronRight className="h-4 w-4 text-primary" />
                  </div>
                </Link>

                <div className="space-y-1 mb-6">
                  {activeSubmenu.categories.map((category, i) => (
                    <Link
                      key={i}
                      href={`${base}${category.href}`}
                      onClick={onClose}
                      className="flex items-center justify-between px-6 py-2.5 hover:bg-surface transition-colors group"
                    >
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                        {category.name}
                      </span>
                    </Link>
                  ))}
                </div>

                {activeSubmenu.sections?.map((section, si) => (
                  <div key={si} className="mb-6">
                    <div className="px-6 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {section.title}
                    </div>
                    <div className="space-y-1">
                      {section.items.map((item, ii) => (
                        <Link
                          key={ii}
                          href={`${base}${item.href}`}
                          onClick={onClose}
                          className="block px-6 py-2.5 text-sm text-foreground hover:bg-surface hover:text-primary transition-colors"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
