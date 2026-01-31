import Link from "next/link";
import { ShoppingCart, User, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  locale: string;
}

const navLinks = [
  { label: "Shop", href: "categories" },
  { label: "Brands", href: "brands" },
  { label: "Concerns", href: "concerns" },
];

export function Header({ locale }: HeaderProps) {
  const base = `/${locale}`;
  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm">
        Fri fragt over 299 kr. • 30 dages returret
      </div>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Åbn menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link
              href={base}
              className="flex items-center font-semibold text-lg text-primary shrink-0"
            >
              Guapo
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6" aria-label="Hovedmenu">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={`${base}/${href}`}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Søg"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Link
              href={`${base}/cart`}
              className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-surface hover:text-primary transition-colors border-2 border-transparent focus-visible:border-primary focus-visible:outline-none"
              aria-label="Kurv"
            >
              <ShoppingCart className="h-5 w-5" />
            </Link>
            <Link
              href={`${base}/account`}
              className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-surface hover:text-primary transition-colors border-2 border-transparent focus-visible:border-primary focus-visible:outline-none"
              aria-label="Konto"
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
