import { Link } from "@tanstack/react-router";

import { Brand } from "@/components/Brand";
import { getPublicSiteConfig } from "@/lib/site-config";

const toTelHref = (phone: string) => `tel:${phone.replace(/[^+0-9]/g, "")}`;

export function PublicFooter() {
  const config = getPublicSiteConfig();

  return (
    <footer className="border-t border-border bg-secondary/35 py-6 sm:py-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 text-sm text-muted-foreground sm:grid-cols-[1fr_auto]">
        <div className="text-center sm:text-left">
          <Link
            to="/"
            className="hidden text-foreground sm:inline-flex"
            aria-label="VHSBOARD — strona główna"
          >
            <Brand />
          </Link>
          <p className="mt-3 hidden max-w-md sm:block">
            Robione między falami a opadami śniegu.
          </p>
          <p className="sm:mt-4">© {new Date().getFullYear()} <a href="https://theconstruct.ing" className="hover:text-primary hover:underline">theconstruct.ing</a></p>
        </div>
        <address className="hidden not-italic sm:block sm:text-right">
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
        </address>
      </div>
    </footer>
  );
}
