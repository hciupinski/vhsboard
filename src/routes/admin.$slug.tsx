import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, X, Plus, Trash2, Save, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListField } from "@/components/admin/ListField";
import { emptyOffer, loadOffers, slugify, upsertOffer, type OfferDraft } from "@/lib/adminStore";

export const Route = createFileRoute("/admin/$slug")({
  head: () => ({
    meta: [
      { title: "Edycja oferty — panel VHSBOARD" },
      {
        name: "description",
        content: "Napisz ofertę wyjazdu: opis, cena, co w cenie, plan dnia i galeria.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Edycja oferty — panel VHSBOARD" },
      { property: "og:description", content: "Napisz ofertę wyjazdu dla VHSBOARD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OfferEditor,
});

function OfferEditor() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const isNew = slug === "new";
  const [offer, setOffer] = useState<OfferDraft | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isNew) setOffer(emptyOffer());
    else setOffer(loadOffers().find((o) => o.slug === slug) ?? emptyOffer());
  }, [slug, isNew]);

  const set = <K extends keyof OfferDraft>(key: K, value: OfferDraft[K]) => {
    setOffer((o) => (o ? { ...o, [key]: value } : o));
    setSaved(false);
  };

  const finalSlug = useMemo(() => (offer ? offer.slug || slugify(offer.title) : ""), [offer]);

  if (!offer) return <div className="min-h-screen bg-muted/40" />;

  const save = (status: OfferDraft["status"]) => {
    const next = upsertOffer({
      ...offer,
      status,
      slug: finalSlug || slugify(offer.title) || "bez-tytulu",
    });
    setOffer(next);
    setSaved(true);
    if (isNew) navigate({ to: "/admin/$slug", params: { slug: next.slug } });
  };

  return (
    <div className="min-h-screen bg-muted/40 pb-24">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            <Button asChild size="sm" variant="ghost" className="rounded-full">
              <Link to="/admin">
                <ArrowLeft className="mr-1 size-4" /> Oferty
              </Link>
            </Button>
            <span className="font-display text-xl tracking-wide">
              {isNew ? "Nowa oferta" : offer.title || "Oferta bez tytułu"}
            </span>
            <Badge variant={offer.status === "published" ? "default" : "secondary"}>
              {offer.status === "published" ? "opublikowana" : "szkic"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {saved ? <span className="text-xs text-muted-foreground">Zapisano</span> : null}
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => save("draft")}
            >
              Zapisz szkic
            </Button>
            <Button size="sm" className="rounded-full" onClick={() => save("published")}>
              <Save className="mr-1 size-4" /> Opublikuj
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <Tabs defaultValue="basics">
          <TabsList className="flex-wrap">
            <TabsTrigger value="basics">Podstawy</TabsTrigger>
            <TabsTrigger value="story">O wyjeździe</TabsTrigger>
            <TabsTrigger value="inout">W cenie i poza</TabsTrigger>
            <TabsTrigger value="days">Dzień po dniu</TabsTrigger>
            <TabsTrigger value="photos">Zdjęcia</TabsTrigger>
          </TabsList>

          <TabsContent
            value="basics"
            className="mt-6 space-y-6 rounded-2xl border border-border/70 bg-background p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tytuł wyjazdu">
                <Input
                  value={offer.title}
                  placeholder="Atlantycki Tydzień Surfingu"
                  onChange={(e) => set("title", e.target.value)}
                />
              </Field>
              <Field label="Adres URL (slug)" hint={`/trips/${finalSlug || "…"}`}>
                <Input
                  value={offer.slug}
                  placeholder={slugify(offer.title) || "atlantic-surf-week"}
                  onChange={(e) => set("slug", slugify(e.target.value))}
                />
              </Field>
              <Field label="Sport">
                <Select value={offer.tag} onValueChange={(v) => set("tag", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Surf">Surf</SelectItem>
                    <SelectItem value="Snow">Snow</SelectItem>
                    <SelectItem value="Combo">Combo</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Miejsce">
                <Input
                  value={offer.place}
                  placeholder="Ericeira, Portugalia"
                  onChange={(e) => set("place", e.target.value)}
                />
              </Field>
              <Field label="Długość i wielkość grupy">
                <Input
                  value={offer.days}
                  placeholder="7 dni · 12-18 osób"
                  onChange={(e) => set("days", e.target.value)}
                />
              </Field>
              <Field label="Cena">
                <Input
                  value={offer.price}
                  placeholder="od 3 100 zł"
                  onChange={(e) => set("price", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Zajawka na kafelku" hint="Widoczna na liście ofert">
              <Textarea
                value={offer.text}
                placeholder="Poranne sesje o świcie, szkolenie dla każdego poziomu…"
                className="min-h-24"
                onChange={(e) => set("text", e.target.value)}
              />
            </Field>

            <Field label="Adres zdjęcia głównego">
              <div className="flex gap-3">
                <Input
                  value={offer.image}
                  placeholder="https://…/okladka.jpg"
                  onChange={(e) => set("image", e.target.value)}
                />
                <div className="h-10 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {offer.image ? (
                    <img src={offer.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ImagePlus className="size-4" />
                    </div>
                  )}
                </div>
              </div>
            </Field>
          </TabsContent>

          <TabsContent
            value="story"
            className="mt-6 space-y-6 rounded-2xl border border-border/70 bg-background p-6"
          >
            <Field label="Zdanie wprowadzające" hint="Jedno zdanie pod tytułem">
              <Textarea
                value={offer.intro}
                className="min-h-20"
                placeholder="Siedem dni na najbardziej pewnym odcinku europejskiego wybrzeża…"
                onChange={(e) => set("intro", e.target.value)}
              />
            </Field>
            <ListField
              label="Akapity opisu"
              hint="Jedno pole na akapit"
              multiline
              values={offer.description}
              placeholder="Opowiedz o tym tygodniu…"
              onChange={(v) => set("description", v)}
            />
            <ListField
              label="Najlepsze momenty"
              values={offer.highlights}
              placeholder="Dwie prowadzone sesje dziennie, każdy poziom"
              onChange={(v) => set("highlights", v)}
            />
          </TabsContent>

          <TabsContent
            value="inout"
            className="mt-6 grid gap-6 rounded-2xl border border-border/70 bg-background p-6 md:grid-cols-2"
          >
            <div className="rounded-xl bg-secondary/40 p-4">
              <p className="mb-3 flex items-center gap-2 font-display text-lg tracking-wide">
                <Check className="size-4 text-primary" /> Co jest w cenie
              </p>
              <ListField
                label="W cenie"
                values={offer.included}
                placeholder="6 nocy we wspólnym surf house"
                onChange={(v) => set("included", v)}
              />
            </div>
            <div className="rounded-xl bg-muted p-4">
              <p className="mb-3 flex items-center gap-2 font-display text-lg tracking-wide">
                <X className="size-4 text-muted-foreground" /> Poza ceną
              </p>
              <ListField
                label="Poza ceną"
                values={offer.notIncluded}
                placeholder="Loty do i z Lizbony"
                onChange={(v) => set("notIncluded", v)}
              />
            </div>
          </TabsContent>

          <TabsContent
            value="days"
            className="mt-6 space-y-4 rounded-2xl border border-border/70 bg-background p-6"
          >
            {offer.schedule.map((s, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-xl border border-border/60 p-4 sm:flex-row"
              >
                <Input
                  value={s.day}
                  placeholder="Dzień 1"
                  className="sm:w-40"
                  onChange={(e) =>
                    set(
                      "schedule",
                      offer.schedule.map((x, j) => (j === i ? { ...x, day: e.target.value } : x)),
                    )
                  }
                />
                <Textarea
                  value={s.text}
                  placeholder="Odbiór w Lizbonie, zakwaterowanie, kolacja powitalna."
                  className="min-h-20"
                  onChange={(e) =>
                    set(
                      "schedule",
                      offer.schedule.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Usuń dzień ${i + 1}`}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    set(
                      "schedule",
                      offer.schedule.filter((_, j) => j !== i),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() =>
                set("schedule", [
                  ...offer.schedule,
                  { day: `Dzień ${offer.schedule.length + 1}`, text: "" },
                ])
              }
            >
              <Plus className="mr-1 size-4" /> Dodaj dzień
            </Button>
          </TabsContent>

          <TabsContent
            value="photos"
            className="mt-6 space-y-4 rounded-2xl border border-border/70 bg-background p-6"
          >
            <p className="text-sm text-muted-foreground">
              Zdjęcia z poprzednich wyjazdów — adres zdjęcia i krótki opis alternatywny.
            </p>
            {offer.gallery.map((g, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center"
              >
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {g.src ? (
                    <img src={g.src} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ImagePlus className="size-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    value={g.src}
                    placeholder="https://…/zdjecie.jpg"
                    onChange={(e) =>
                      set(
                        "gallery",
                        offer.gallery.map((x, j) => (j === i ? { ...x, src: e.target.value } : x)),
                      )
                    }
                  />
                  <Input
                    value={g.alt}
                    placeholder="Ekipa przy ognisku obok busa"
                    onChange={(e) =>
                      set(
                        "gallery",
                        offer.gallery.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)),
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Usuń zdjęcie ${i + 1}`}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    set(
                      "gallery",
                      offer.gallery.filter((_, j) => j !== i),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => set("gallery", [...offer.gallery, { src: "", alt: "" }])}
            >
              <Plus className="mr-1 size-4" /> Dodaj zdjęcie
            </Button>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label className="text-sm font-semibold">{label}</Label>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
