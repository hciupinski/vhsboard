import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Snowflake, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  adminPortalThemeKey,
  adminPortalThemeOptions,
  publicPortalThemeKey,
} from "@/lib/portal-theme/query-options";
import { savePortalTheme } from "@/lib/portal-theme/repository";
import type { PortalTheme } from "@/lib/portal-theme/schema";

const themes = [
  {
    value: "original",
    label: "Obecny",
    description: "Ciepła kremowa paleta i pomarańczowe akcenty.",
    icon: Sun,
  },
  {
    value: "winter",
    label: "Zimowy",
    description: "Chłodna biel, granat i błękit. Pomarańczowy hover.",
    icon: Snowflake,
  },
] as const;

export function PortalThemeManager() {
  const client = useQueryClient();
  const settings = useQuery(adminPortalThemeOptions());
  const [draft, setDraft] = useState<PortalTheme | null>(null);
  const selected = draft ?? settings.data ?? "original";
  const mutation = useMutation({
    mutationFn: (theme: PortalTheme) => savePortalTheme(theme),
    onSuccess: async (_, theme) => {
      await Promise.all([
        client.cancelQueries({ queryKey: adminPortalThemeKey }),
        client.cancelQueries({ queryKey: publicPortalThemeKey }),
      ]);
      client.setQueryData(adminPortalThemeKey, theme);
      client.setQueryData(publicPortalThemeKey, theme);
      void client.invalidateQueries({ queryKey: publicPortalThemeKey });
      setDraft(null);
    },
  });
  const disabled = settings.isPending || settings.isError || mutation.isPending;

  return (
    <section
      aria-labelledby="portal-theme-heading"
      className="space-y-5 rounded-2xl border border-border/70 bg-background p-6"
    >
      <div>
        <h2 id="portal-theme-heading" className="font-display text-2xl tracking-wide">
          Wygląd strony
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Wybrany motyw obowiązuje wszystkich odwiedzających na każdej podstronie. Otwarte strony
          odświeżają go w ciągu 30 sekund lub po powrocie do karty.
        </p>
      </div>
      {settings.isPending ? (
        <p className="text-sm text-muted-foreground">Ładowanie wyglądu strony…</p>
      ) : null}
      {settings.isError ? (
        <div>
          <p role="alert" className="text-sm text-destructive">
            Nie udało się pobrać wyglądu strony.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            disabled={settings.isFetching}
            onClick={() => void settings.refetch()}
          >
            Spróbuj ponownie
          </Button>
        </div>
      ) : null}
      <fieldset disabled={disabled} className="grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">Motyw kolorystyczny</legend>
        {themes.map(({ value, label, description, icon: Icon }) => (
          <label
            key={value}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 has-checked:border-primary has-checked:bg-secondary/35 has-disabled:cursor-default has-disabled:opacity-60"
          >
            <input
              type="radio"
              name="portal-theme"
              value={value}
              checked={selected === value}
              className="mt-1 size-4 shrink-0 accent-primary"
              onChange={() => {
                setDraft(value);
                mutation.reset();
              }}
            />
            <span>
              <span className="flex items-center gap-2 font-semibold">
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                {description}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      {mutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Nie udało się zapisać wyglądu strony. Spróbuj ponownie.
        </p>
      ) : null}
      {mutation.isSuccess ? (
        <p role="status" className="text-sm font-medium">
          Wygląd strony został zapisany dla wszystkich odwiedzających.
        </p>
      ) : null}
      <Button
        type="button"
        className="rounded-full"
        disabled={disabled || selected === settings.data}
        onClick={() => mutation.mutate(selected)}
      >
        {mutation.isPending ? "Zapisywanie wyglądu…" : "Zapisz i zastosuj globalnie"}
      </Button>
    </section>
  );
}
