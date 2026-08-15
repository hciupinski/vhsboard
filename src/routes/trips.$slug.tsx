import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, X, ArrowLeft, MapPin, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { getTrip, trips } from "@/lib/trips";

export const Route = createFileRoute("/trips/$slug")({
  loader: ({ params }) => {
    const trip = getTrip(params.slug);
    if (!trip) throw notFound();
    return { trip };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Nie znaleziono wyjazdu — VHSBOARD" }, { name: "robots", content: "noindex" }] };
    }
    const { trip } = loaderData;
    const title = `${trip.title} — ${trip.place} | VHSBOARD`;
    return {
      meta: [
        { title },
        { name: "description", content: trip.intro },
        { property: "og:title", content: title },
        { property: "og:description", content: trip.intro },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: TripDetail,
});

function TripDetail() {
  const { trip } = Route.useLoaderData();
  const others = trips.filter((t) => t.slug !== trip.slug);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link to="/" className="text-foreground">
            <Brand />
          </Link>
          <Button asChild size="sm" variant="ghost" className="rounded-full">
            <Link to="/" hash="offers">
              <ArrowLeft className="mr-1 size-4" /> Wszystkie wyjazdy
            </Link>
          </Button>
        </nav>
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <img
            src={trip.image}
            alt={`${trip.title} — ${trip.place}`}
            width={1600}
            height={1104}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/55" />
          <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-16 sm:pb-20 sm:pt-24">
            <span className="inline-block rounded-full bg-sunset-gradient px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
              {trip.tag}
            </span>
            <h1 className="mt-4 max-w-2xl text-5xl leading-[0.95] text-background sm:text-7xl">
              {trip.title}
            </h1>
            <p className="mt-4 max-w-xl text-background/85">{trip.intro}</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-background/90">
              <span className="flex items-center gap-2"><MapPin className="size-4" />{trip.place}</span>
              <span className="flex items-center gap-2"><Users className="size-4" />{trip.days}</span>
              <span className="flex items-center gap-2"><Wallet className="size-4" />{trip.price} od osoby</span>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1.6fr_1fr] sm:py-20">
          <div>
            <h2 className="text-3xl sm:text-4xl">O wyjeździe</h2>
            {trip.description.map((p) => (
              <p key={p.slice(0, 24)} className="mt-4 text-muted-foreground">{p}</p>
            ))}

            <h2 className="mt-12 text-3xl sm:text-4xl">Najlepsze momenty</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {trip.highlights.map((h) => (
                <li key={h} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm">
                  {h}
                </li>
              ))}
            </ul>

            <h2 className="mt-12 text-3xl sm:text-4xl">Jak wyglądają dni</h2>
            <ol className="mt-4 space-y-4 border-l border-border pl-5">
              {trip.schedule.map((s) => (
                <li key={s.day} className="relative">
                  <span className="absolute -left-[27px] top-1.5 size-3 rounded-full bg-sunset-gradient" />
                  <p className="font-display text-xl text-foreground">{s.day}</p>
                  <p className="text-sm text-muted-foreground">{s.text}</p>
                </li>
              ))}
            </ol>

            <h2 className="mt-12 text-3xl sm:text-4xl">Co jest w cenie</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <ul className="space-y-2.5">
                {trip.included.map((i) => (
                  <li key={i} className="flex gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-2.5">
                <p className="font-display text-xl text-muted-foreground">Poza ceną</p>
                {trip.notIncluded.map((i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                    <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-warm">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Cena od osoby</p>
              <p className="font-display text-4xl text-primary">{trip.price}</p>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <dt className="text-muted-foreground">Gdzie</dt>
                  <dd className="font-medium">{trip.place}</dd>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <dt className="text-muted-foreground">Grupa</dt>
                  <dd className="font-medium">{trip.days}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Poziom</dt>
                  <dd className="font-medium">Każdy poziom</dd>
                </div>
              </dl>
              <Button asChild size="lg" className="mt-6 w-full rounded-full">
                <Link to="/" hash="contact">Zapytaj o ten wyjazd</Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Zaliczka 700 zł · pełny zwrot do 45 dni przed wyjazdem
              </p>
            </div>
          </aside>
        </div>

        <section className="bg-secondary/60 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-3xl sm:text-4xl">Zdjęcia z poprzednich wyjazdów</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trip.gallery.map((g) => (
                <img
                  key={g.alt}
                  src={g.src}
                  alt={g.alt}
                  loading="lazy"
                  width={1200}
                  height={900}
                  className="h-56 w-full rounded-2xl object-cover transition-transform duration-300 hover:-translate-y-1 hover:shadow-warm"
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-3xl sm:text-4xl">Inne wyjazdy</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {others.map((o) => (
              <Link
                key={o.slug}
                to="/trips/$slug"
                params={{ slug: o.slug }}
                className="group flex gap-4 rounded-3xl border border-border bg-card p-4 transition-transform hover:-translate-y-1 hover:shadow-warm"
              >
                <img
                  src={o.image}
                  alt={o.title}
                  loading="lazy"
                  width={1200}
                  height={900}
                  className="size-24 shrink-0 rounded-2xl object-cover"
                />
                <div>
                  <h3 className="text-xl">{o.title}</h3>
                  <p className="text-sm text-accent">{o.place}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{o.days} · {o.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-5 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <Brand className="text-foreground" />
          <p>© 2026 · Robione między falami a opadami śniegu.</p>
        </div>
      </footer>
    </div>
  );
}
