import { createFileRoute } from "@tanstack/react-router";

import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { ContactDocuments } from "@/components/public/ContactDocuments";
import { PublicJsonLd } from "@/components/seo/PublicJsonLd";
import { getPublicSiteConfig } from "@/lib/site-config";
import { createPageMetadata } from "@/lib/seo";

const toTelHref = (phone: string) => `tel:${phone.replace(/[^+0-9]/g, "")}`;

export const Route = createFileRoute("/kontakt")({
  head: () =>
    createPageMetadata({
      path: "/kontakt",
      title: "Kontakt | VHSBOARD",
      description: "Skontaktuj się z VHSBOARD w sprawie wyjazdu lub eventu.",
    }),
  component: ContactPage,
});

function ContactPage() {
  const config = getPublicSiteConfig();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <PublicHeader />
      <PublicJsonLd path="/kontakt" label="Kontakt" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-16 sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Kontakt</p>
        <h1 className="mt-3 text-5xl leading-[0.95] sm:text-7xl">MASZ PYTANIA? POGADAJMY!</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Napisz lub zadzwoń — chętnie odpowiemy na pytania dotyczące wyjazdów, eventów i obozów dla dzieci.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <section className="rounded-3xl bg-sunset-gradient p-7 text-primary-foreground shadow-warm">
            <h2 className="text-3xl">SKONTAKTUJ SIĘ Z NAMI</h2>
            <p className="mt-4">
              <a
                className="underline-offset-4 hover:underline"
                href={`mailto:${config.contactEmail}`}
              >
                {config.contactEmail}
              </a>
            </p>
            <p className="mt-2">
              <a
                className="underline-offset-4 hover:underline"
                href={toTelHref(config.contactPhone)}
              >
                {config.contactPhone}
              </a>
            </p>
            <h3 className="mt-3">Sprawdź co u nas słychać i dołącz do społeczności VHS</h3>
            <p>
              <a href="https://www.facebook.com/share/1E7xY7Ed2B" className="underline-offset-4 hover:underline p-1 hover:invert-[.1]" target="_blank"
                rel="noreferrer">
                <img src="/facebook-black.png" alt="Facebook" className="inline-block h-6 w-6 invert" />
              </a>
              <a href="https://www.instagram.com/vhsboard" className="underline-offset-4 hover:underline p-1 hover:invert-[.1]" target="_blank"
                rel="noreferrer">
                <img src="/instagram-black.png" alt="Instagram" className="inline-block h-6 w-6 invert" />
              </a>
            </p>
          </section>
          <section className="rounded-3xl border border-border bg-card p-7">
            <h2 className="text-3xl">Dane firmy</h2>
            <address className="mt-4 not-italic text-muted-foreground">
              <p>{config.businessName}</p>
              <p>{config.businessStreet}</p>
              <p>
                {config.businessPostalCode} {config.businessCity}
              </p>
              <p className="mt-3">NIP: {config.businessNip}</p>
              <p>REGON: {config.businessRegon}</p>
              <p className="mt-3">Konto bankowe: {config.businessBankAccount}</p>
            </address>
          </section>
        </div>
        <ContactDocuments />
      </main>
      <PublicFooter />
    </div>
  );
}
