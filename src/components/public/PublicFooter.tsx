import { Link } from "@tanstack/react-router";

import { Brand } from "@/components/Brand";
import { getPublicSiteConfig } from "@/lib/site-config";

const toTelHref = (phone: string) => `tel:${phone.replace(/[^+0-9]/g, "")}`;

export function PublicFooter() {
  const config = getPublicSiteConfig();

  return (
    <footer className="border-t border-border bg-secondary/35 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 text-sm text-muted-foreground sm:grid-cols-[1fr_auto]">
        <div>
          <Link
            to="/"
            className="inline-flex text-foreground"
            aria-label="VHSBOARD — strona główna"
          >
            <Brand />
          </Link>
          <p className="mt-3 max-w-md">
            Wyjazdy, wydarzenia i aktywności prowadzone w dobrym rytmie.
          </p>
          <p className="mt-4">© {new Date().getFullYear()} VHSBOARD.</p>
        </div>
        <address className="not-italic sm:text-right">
          <p className="font-medium text-foreground">{config.businessName}</p>
          <p>{config.businessStreet}</p>
          <p>
            {config.businessPostalCode} {config.businessCity}
          </p>
          <p className="mt-3">
            <a
              className="hover:text-primary hover:underline"
              href={`mailto:${config.contactEmail}`}
            >
              {config.contactEmail}
            </a>
          </p>
          <p>
            <a className="hover:text-primary hover:underline" href={toTelHref(config.contactPhone)}>
              {config.contactPhone}
            </a>
          </p>
          <p className="mt-3">NIP: {config.businessNip}</p>
          <p>REGON: {config.businessRegon}</p>
        </address>
      </div>
    </footer>
  );
}
