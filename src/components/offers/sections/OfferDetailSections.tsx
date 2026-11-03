import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { OfferGallery } from "@/components/offers/OfferGallery";
import { OfferHighlights } from "./OfferHighlights";
import { getOfferSections, type OfferSection } from "@/lib/offers/sections";
import type { PublicOffer } from "@/lib/offers/types";
import { sectionIsEnabled, type ExtraPrice } from "@/lib/offers/content-v2";
import { formatTripDates } from "@/lib/offers/formatters";

function Price({ value }: { value: ExtraPrice }) {
  return (
    <p className="mt-3 font-semibold text-primary">
      {value.kind === "included"
        ? "W cenie wyjazdu"
        : `${value.from ? "od " : ""}${new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value.amount)}${value.unit ? ` / ${value.unit}` : ""}`}
    </p>
  );
}
function Copy({ children }: { children: string }) {
  return <p className="mt-4 whitespace-pre-line break-words text-muted-foreground">{children}</p>;
}
function Block({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} tabIndex={-1} aria-label={title} className="min-w-0 break-words">
      <h2 className="text-3xl sm:text-4xl">{title}</h2>
      {children}
    </section>
  );
}
export function OfferDetailSections({
  offer,
  sidebar,
}: {
  offer: PublicOffer;
  sidebar: ReactNode;
}) {
  const { content } = offer;
  const sections = getOfferSections(offer);
  const camp = offer.offerKind === "day_camp" ? offer.content : null;
  const render = (section: OfferSection) => {
    const { id, label, editorTab } = section;
    if (editorTab === "photos")
      return <OfferGallery key={id} id={id} title={label} images={offer.images} />;
    let body: ReactNode = null;
    if (editorTab === "story")
      body = (
        <>
          {content.paragraphs.map((paragraph, i) => (
            <Copy key={i}>{paragraph}</Copy>
          ))}
          {camp ? (
            <>
              <div className="mt-8 rounded-2xl border bg-card p-5">
                <h3 className="text-2xl">Miejsce zajęć</h3>
                <Copy>{camp.venueDescription}</Copy>
              </div>
              <section id="dla-rodzica" tabIndex={-1} className="mt-8">
                <h3 className="text-2xl">Dla rodzica</h3>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  {Object.entries({
                    "Wiek uczestników": camp.parentInfo.ageRange,
                    Opieka: camp.parentInfo.supervision,
                    Bezpieczeństwo: camp.parentInfo.safety,
                    Wyżywienie: camp.parentInfo.meals,
                    ...(!sectionIsEnabled(content.transport)
                      ? { Transport: camp.parentInfo.transport }
                      : {}),
                  })
                    .filter(([, value]) => value)
                    .map(([title, value]) => (
                      <div key={title} className="rounded-2xl border bg-card p-4">
                        <dt className="font-medium">{title}</dt>
                        <dd className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                          {value}
                        </dd>
                      </div>
                    ))}
                </dl>
              </section>
            </>
          ) : null}
        </>
      );
    if (editorTab === "highlights") {
      const schedule =
        "schedule" in content
          ? content.schedule.map((item) => ({ title: item.day, text: item.text }))
          : content.dayProgram.map((item) => ({ title: item.time, text: item.text }));
      body = (
        <>
          <OfferHighlights highlights={content.highlights} />
          {schedule.length ? (
            <section id={camp ? "plan-dnia" : "plan-wyjazdu"} tabIndex={-1} className="mt-8">
              <h3 className="text-2xl">{camp ? "Plan dnia" : "Plan wyjazdu"}</h3>
              <ol className="mt-4 space-y-4 border-l border-border pl-5">
                {schedule.map((item, i) => (
                  <li key={i}>
                    <p className="font-display text-xl">{item.title}</p>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">{item.text}</p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </>
      );
    }
    if (editorTab === "inout")
      body = (
        <>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {[
              ["W cenie", content.included],
              ["Poza ceną", content.excluded],
            ].map(([title, items]) => (
              <div key={title as string}>
                <h3 className="text-2xl">{title as string}</h3>
                <ul className="mt-3 space-y-3">
                  {(items as string[]).map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                      <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {camp?.terms.length ? (
            <section id="turnusy" tabIndex={-1} className="mt-8">
              <h3 className="text-2xl">Turnusy i ceny</h3>
              <div className="mt-4 grid gap-5 md:grid-cols-2">
                {camp.terms.map((term, i) => (
                  <article
                    key={term.id ?? i}
                    className="min-w-0 rounded-3xl border bg-card p-6 shadow-warm"
                  >
                    <h4 className="text-2xl">{term.label}</h4>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatTripDates(term.startDate, term.endDate)}
                    </p>
                    {term.priceOptions.map((option, n) => (
                      <div key={n} className="mt-4 border-t pt-4">
                        <p>{option.label}</p>
                        <p className="font-display text-2xl text-primary">
                          {new Intl.NumberFormat("pl-PL", {
                            style: "currency",
                            currency: "PLN",
                          }).format(option.price)}
                        </p>
                      </div>
                    ))}
                    <Button asChild className="mt-5 w-full rounded-full">
                      <a href={term.bookingUrl} target="_blank" rel="noopener noreferrer">
                        Zapisz się
                      </a>
                    </Button>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </>
      );
    if (editorTab === "accommodation" && content.accommodation)
      body = (
        <>
          <Copy>{content.accommodation.description}</Copy>
          <OfferGallery images={offer.accommodationImages} />
        </>
      );
    if (editorTab === "resort" && content.resort)
      body = (
        <>
          <h3 className="mt-4 text-2xl">{content.resort.name}</h3>
          <Copy>{content.resort.description}</Copy>
          {offer.resortMap ? <OfferGallery images={[offer.resortMap]} contain /> : null}
          {content.resort.mapUrl ? (
            <a
              className="mt-4 inline-block underline hover:text-interaction"
              href={content.resort.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Otwórz oficjalną mapę tras
            </a>
          ) : null}
        </>
      );
    if (editorTab === "training" && content.training)
      body = (
        <>
          <Copy>{content.training.description}</Copy>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {content.training.items.map((item) => (
              <article key={item.id} className="min-w-0 break-words rounded-2xl border bg-card p-6">
                <h3 className="text-2xl">{item.title}</h3>
                <Copy>{item.description}</Copy>
                {item.level ? (
                  <p className="mt-3 text-sm">
                    <strong>Dla kogo: </strong>
                    {item.level}
                  </p>
                ) : null}
                {item.scope ? (
                  <p className="mt-3 text-sm">
                    <strong>Zakres zajęć: </strong>
                    {item.scope}
                  </p>
                ) : null}
                <Price value={item.price} />
              </article>
            ))}
          </div>
        </>
      );
    if (editorTab === "transport" && content.transport) {
      const transport = content.transport;
      const modes = {
        coach: "Autokar",
        plane: "Samolot",
        train: "Pociąg",
        own: "Dojazd własny",
        other: transport.customType || "Inny",
      };
      const date = (value: string) =>
        /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value))
          ? new Intl.DateTimeFormat("pl-PL", { timeZone: "UTC", dateStyle: "long" }).format(
              new Date(`${value}T00:00:00Z`),
            )
          : "Do uzupełnienia";
      body = (
        <>
          <p className="mt-4 font-semibold">{modes[transport.type]}</p>
          <Copy>{transport.description}</Copy>
          {transport.type !== "own" ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {transport.journeys.map((journey, i) => (
                <article key={journey.termId ?? i} className="rounded-2xl border bg-card p-6">
                  {camp ? (
                    <h3 className="text-2xl">
                      {camp.terms.find((term) => term.id === journey.termId)?.label ?? "Turnus"}
                    </h3>
                  ) : null}
                  <dl className="mt-3 space-y-4">
                    <div>
                      <dt className="font-semibold">Wyjazd</dt>
                      <dd className="mt-1">
                        {date(journey.departureDate)}
                        {journey.departureTime ? `, ${journey.departureTime}` : ""}
                        <br />
                        {journey.departurePlace}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Powrót</dt>
                      <dd className="mt-1">
                        {date(journey.returnDate)}
                        {journey.returnTime ? `, ${journey.returnTime}` : ""}
                        <br />
                        {journey.returnPlace}
                      </dd>
                    </div>
                  </dl>
                  {journey.note ? <Copy>{journey.note}</Copy> : null}
                </article>
              ))}
            </div>
          ) : null}
        </>
      );
    }
    if (editorTab === "insurance" && content.insurance) {
      const insurance = content.insurance;
      body = (
        <>
          <Copy>{insurance.description}</Copy>
          {insurance.provider ? (
            <p className="mt-3 text-sm">Ubezpieczyciel: {insurance.provider}</p>
          ) : null}
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {insurance.packages.map((item) => (
              <article
                key={item.id}
                className="min-w-0 break-words rounded-2xl border bg-card p-6 shadow-warm"
              >
                <h3 className="text-2xl">{item.title}</h3>
                <Price value={item.price} />
                <Copy>{item.description}</Copy>
                <dl className="mt-5 space-y-3">
                  {item.risks.map((risk) => (
                    <div key={risk.id}>
                      <dt className="text-sm text-muted-foreground">{risk.label}</dt>
                      <dd className="font-medium">{risk.value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
          {insurance.extensions.length ? (
            <div className="mt-6 rounded-2xl border bg-card p-6">
              <h3 className="text-2xl">Opcjonalne rozszerzenia</h3>
              <ul className="mt-4 divide-y">
                {insurance.extensions.map((item) => (
                  <li
                    key={item.id}
                    className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                  >
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      {item.description ? <Copy>{item.description}</Copy> : null}
                    </div>
                    <Price value={item.price} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {insurance.informationUrl ? (
            <a
              className="mt-4 inline-block underline hover:text-interaction"
              href={insurance.informationUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Warunki i informacje o ubezpieczeniu
            </a>
          ) : null}
        </>
      );
    }
    return (
      <Block key={id} id={id} title={label}>
        {body}
      </Block>
    );
  };
  const primary = new Set(["story", "highlights", "inout"]);
  return (
    <>
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 sm:py-14 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-12">
          {sections.filter((section) => primary.has(section.editorTab)).map(render)}
        </div>
        <aside className="lg:sticky lg:top-[calc(var(--trip-header-height,61px)+var(--trip-nav-height,0px)+24px)] lg:self-start">
          {sidebar}
        </aside>
      </div>
      {sections
        .filter((section) => !primary.has(section.editorTab))
        .map((section) =>
          section.editorTab === "photos" ? (
            render(section)
          ) : (
            <div key={section.id} className="border-t border-border py-12 sm:py-14">
              <div className="mx-auto max-w-6xl px-5">{render(section)}</div>
            </div>
          ),
        )}
    </>
  );
}
