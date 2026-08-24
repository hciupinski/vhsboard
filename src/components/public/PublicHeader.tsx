import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";

import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navigationItems = [
  { to: "/wyjazdy", label: "Wyjazdy" },
  { to: "/eventy", label: "Eventy" },
  { to: "/polkolonie", label: "Półkolonie" },
  { to: "/o-nas", label: "O nas" },
  { to: "/kontakt", label: "Kontakt" },
] as const;

const navigationLinkClassName =
  "rounded-sm text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
      <nav
        aria-label="Nawigacja główna"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3"
      >
        <Link to="/" className="shrink-0 text-foreground" aria-label="VHSBOARD — strona główna">
          <Brand />
        </Link>

        <div className="hidden items-center gap-6 sm:flex">
          {navigationItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={navigationLinkClassName}
              activeProps={{ "aria-current": "page", className: "text-primary" }}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden rounded-full sm:inline-flex">
            <Link to="/kontakt">Napisz do nas</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full sm:hidden"
                aria-label="Otwórz menu"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" aria-describedby="mobile-menu-description">
              <SheetTitle className="sr-only">Menu główne</SheetTitle>
              <SheetDescription id="mobile-menu-description" className="sr-only">
                Przejdź do wybranej podstrony VHSBOARD.
              </SheetDescription>
              <nav aria-label="Menu mobilne" className="mt-10 flex flex-col gap-5">
                {navigationItems.map(({ to, label }) => (
                  <SheetClose key={to} asChild>
                    <Link
                      to={to}
                      className="rounded-sm text-2xl text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      activeProps={{ "aria-current": "page", className: "text-primary" }}
                    >
                      {label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
