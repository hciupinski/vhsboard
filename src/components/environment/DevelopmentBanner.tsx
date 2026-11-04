import { isDevelopmentSite } from "@/lib/env";

export function DevelopmentBanner() {
  if (!isDevelopmentSite()) return null;

  return (
    <div
      data-development-banner
      className="pointer-events-none fixed top-0 left-0 z-[60] flex h-6 items-center rounded-br-lg bg-development-banner px-3 font-sans text-[11px] font-bold tracking-[0.1em] text-development-banner-foreground"
    >
      WERSJA DEWELOPERSKA
    </div>
  );
}
