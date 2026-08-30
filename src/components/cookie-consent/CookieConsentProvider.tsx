import { type ReactNode, createContext, useEffect, useState } from "react";

import {
  defaultCookiePreferences,
  getCookiePreferences,
  saveCookiePreferences,
  type CookiePreferences,
} from "@/lib/cookie-consent";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

type CookieConsentContextValue = {
  openPreferences: () => void;
};

export const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isBannerOpen, setIsBannerOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [preferences, setPreferences] = useState(defaultCookiePreferences);

  useEffect(() => {
    const storedPreferences = getCookiePreferences();

    setPreferences(storedPreferences ?? defaultCookiePreferences);
    setIsBannerOpen(storedPreferences === null);
    setIsReady(true);
  }, []);

  const savePreferences = (nextPreferences: CookiePreferences) => {
    if (!saveCookiePreferences(nextPreferences)) return;

    setPreferences(nextPreferences);
    setIsBannerOpen(false);
    setIsPreferencesOpen(false);
  };

  const openPreferences = () => {
    setPreferences(getCookiePreferences() ?? defaultCookiePreferences);
    setIsPreferencesOpen(true);
  };

  return (
    <CookieConsentContext.Provider value={{ openPreferences }}>
      {children}
      {isReady && isBannerOpen ? (
        <CookieConsentBanner
          onAcceptAll={() => savePreferences({ analytics: true, marketing: true })}
          onCustomize={openPreferences}
          onRejectAll={() => savePreferences(defaultCookiePreferences)}
        />
      ) : null}
      <CookiePreferencesDialog
        onOpenChange={setIsPreferencesOpen}
        onPreferencesChange={setPreferences}
        onRejectAll={() => savePreferences(defaultCookiePreferences)}
        onSave={() => savePreferences(preferences)}
        open={isPreferencesOpen}
        preferences={preferences}
      />
    </CookieConsentContext.Provider>
  );
}

function CookieConsentBanner({
  onAcceptAll,
  onCustomize,
  onRejectAll,
}: {
  onAcceptAll: () => void;
  onCustomize: () => void;
  onRejectAll: () => void;
}) {
  return (
    <aside
      aria-labelledby="cookie-consent-heading"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-background/20 bg-foreground/96 text-background shadow-2xl"
    >
      <div className="mx-auto max-w-6xl px-5 py-6 sm:py-8">
        <h2 id="cookie-consent-heading" className="text-3xl leading-none sm:text-4xl">
          Szanujemy Twoją prywatność
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-background/80 sm:text-base">
          Używamy niezbędnych plików cookie, aby strona działała poprawnie. Za Twoją zgodą możemy w
          przyszłości korzystać z dodatkowych plików do analizy ruchu i dopasowania komunikacji.
        </p>
        <p className="mt-2 text-sm text-background/70">
          Swoją decyzję możesz zmienić w każdej chwili.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Button
            className="h-11 border-background/70 bg-transparent text-background hover:bg-background hover:text-foreground"
            onClick={onCustomize}
            size="lg"
            variant="outline"
          >
            Dostosuj
          </Button>
          <Button
            className="h-11 bg-ocean text-accent-foreground hover:bg-ocean/85"
            onClick={onRejectAll}
            size="lg"
          >
            Odrzuć wszystkie
          </Button>
          <Button className="h-11" onClick={onAcceptAll} size="lg">
            Akceptuję wszystkie
          </Button>
        </div>
      </div>
    </aside>
  );
}

function CookiePreferencesDialog({
  onOpenChange,
  onPreferencesChange,
  onRejectAll,
  onSave,
  open,
  preferences,
}: {
  onOpenChange: (open: boolean) => void;
  onPreferencesChange: (preferences: CookiePreferences) => void;
  onRejectAll: () => void;
  onSave: () => void;
  open: boolean;
  preferences: CookiePreferences;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border-border bg-card p-6 text-card-foreground sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-4xl leading-none">
            Ustawienia cookies
          </DialogTitle>
          <DialogDescription className="pt-2 text-left leading-relaxed">
            Wybierz, na które dodatkowe pliki cookie wyrażasz zgodę. Ustawienia możesz w każdej
            chwili zmienić w stopce strony.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <CookieCategory
            checked
            description="Zapamiętują Twoją decyzję i umożliwiają poprawne działanie strony."
            disabled
            id="cookie-necessary"
            label="Niezbędne"
          />
          <CookieCategory
            checked={preferences.analytics}
            description="Pomogą nam w przyszłości zrozumieć, jak odwiedzający korzystają ze strony."
            id="cookie-analytics"
            label="Analityczne"
            onCheckedChange={(analytics) => onPreferencesChange({ ...preferences, analytics })}
          />
          <CookieCategory
            checked={preferences.marketing}
            description="Pozwolą w przyszłości dopasować komunikację i reklamy do Twoich zainteresowań."
            id="cookie-marketing"
            label="Marketingowe"
            onCheckedChange={(marketing) => onPreferencesChange({ ...preferences, marketing })}
          />
        </div>
        <DialogFooter className="gap-3 sm:justify-between sm:space-x-0">
          <Button onClick={onRejectAll} variant="outline">
            Odrzuć wszystkie
          </Button>
          <Button onClick={onSave}>Zapisz ustawienia</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CookieCategory({
  checked,
  description,
  disabled = false,
  id,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  id: string;
  label: string;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-secondary p-4">
      <div>
        <label className="font-semibold text-foreground" htmlFor={id}>
          {label}
        </label>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} disabled={disabled} id={id} onCheckedChange={onCheckedChange} />
    </div>
  );
}
