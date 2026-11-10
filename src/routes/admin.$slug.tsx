import { normalizeOfferContentV2 } from "@/lib/offers/content-v2";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { AdminGuard, AdminSignOutButton } from "@/components/admin/AdminGuard";
import { OfferEditorForm } from "@/components/admin/OfferEditorForm";
import { OfferImageManager } from "@/components/admin/OfferImageManager";
import { OfferStatusActions } from "@/components/admin/OfferStatusActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createEmptyEditableOfferInput,
  validateOfferEditor,
  getEditorFieldErrors,
  type EditableOffer,
  type EditableOfferInput,
} from "@/lib/offers/editor-schema";
import { recordEditedFields, visibleOfferErrors } from "@/lib/offers/live-validation";
import { getOfferImageErrors } from "@/lib/offers/publication-readiness";
import { OfferRepositoryError } from "@/lib/offers/offer-repository-error";
import {
  createOffer,
  getAdminOffer,
  getOfferImageReadiness,
  setOfferStatus,
  updateOffer,
} from "@/lib/offers/admin-repository";
import { homeOffersQueryOptions, publishedOfferQueryOptions } from "@/lib/offers/query-options";
import type { OfferStatus } from "@/lib/offers/types";

export const Route = createFileRoute("/admin/$slug")({
  head: () => ({
    meta: [
      { title: "Edycja oferty — panel VHSBOARD" },
      {
        name: "description",
        content: "Napisz ofertę wyjazdu: opis, cena, co w cenie, plan dnia i galeria.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Edycja oferty — panel VHSBOARD" },
      { property: "og:description", content: "Napisz ofertę wyjazdu dla VHSBOARD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OfferEditor,
});

const statusLabels: Record<OfferStatus, string> = {
  draft: "Szkic",
  published: "Opublikowana",
  archived: "Zarchiwizowana",
};
const readinessCheckErrorMessage = "Nie udało się sprawdzić zdjęć wymaganych do publikacji.";

const toEditableInput = ({ id: _id, status: _status, ...input }: EditableOffer) => ({
  ...input,
  content: normalizeOfferContentV2(input.content, input.offerKind ?? "trip"),
});

const offerActionMessage = (error: unknown, fallback: string) =>
  error instanceof OfferRepositoryError ? error.message : fallback;

function OfferEditor() {
  return (
    <AdminGuard>
      <OfferEditorContent />
    </AdminGuard>
  );
}

function OfferEditorContent() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = slug === "new";
  const isFormDirty = useRef(false);
  const [formValue, setFormValue] = useState<EditableOfferInput>(() =>
    createEmptyEditableOfferInput(),
  );
  const [persistedOffer, setPersistedOffer] = useState<EditableOffer | null>(null);
  const [editedFields, setEditedFields] = useState<ReadonlySet<string>>(() => new Set());
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const offerQuery = useQuery({
    queryKey: ["admin-offer", slug],
    queryFn: () => getAdminOffer(slug),
    enabled: !isNew,
  });

  useEffect(() => {
    if (isNew || !offerQuery.data) return;
    const offer = offerQuery.data;
    setPersistedOffer(offer);
    setFormValue((current) =>
      isFormDirty.current
        ? { ...current, heroImagePath: offer.heroImagePath }
        : toEditableInput(offer),
    );
  }, [isNew, offerQuery.data]);

  const currentStatus = persistedOffer?.status ?? "draft";
  const readinessQuery = useQuery({
    queryKey: [
      "admin-offer-publish-readiness",
      persistedOffer?.id,
      formValue.heroImagePath,
    ] as const,
    queryFn: ({ queryKey: [, id, heroPath] }) => getOfferImageReadiness(id!, heroPath),
    enabled: persistedOffer !== null && currentStatus !== "archived",
  });
  const createMutation = useMutation({ mutationFn: createOffer });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: EditableOfferInput }) =>
      updateOffer(id, input),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "draft" | "published" }) =>
      setOfferStatus(id, status),
  });

  const validation = validateOfferEditor(formValue);
  const publicationErrors = getEditorFieldErrors(
    validation.publication.success ? undefined : validation.publication.error,
  );
  const mediaChecked = readinessQuery.isSuccess && !readinessQuery.isFetching;
  const imageErrors = persistedOffer
    ? getOfferImageErrors(formValue, mediaChecked ? readinessQuery.data : undefined)
    : {};
  const hasImageErrors = Object.keys(imageErrors).length > 0;
  const readyToPublish = mediaChecked && !hasImageErrors && validation.publication.success;
  const canPublish = !isNew && persistedOffer !== null && readyToPublish;
  const draftSaveBlocked = attemptedSave && currentStatus === "draft" && !validation.draft.success;
  const currentErrors = draftSaveBlocked
    ? getEditorFieldErrors(validation.draft.error)
    : { ...publicationErrors, ...imageErrors };
  const fieldErrors =
    currentStatus === "archived"
      ? {}
      : persistedOffer || attemptedSave
        ? currentErrors
        : visibleOfferErrors(currentErrors, editedFields);
  const validationTitle = draftSaveBlocked
    ? "Popraw pola wymagane do zapisania szkicu."
    : currentStatus === "published"
      ? "Do poprawienia przed zapisaniem opublikowanej oferty"
      : "Do poprawienia przed publikacją";

  // Report paths and known validation messages, without form values or API responses.
  const readiness = readinessQuery.isError ? "error" : hasImageErrors ? "missing_images" : null;
  const publishDiagnostics =
    currentStatus === "draft" &&
    (persistedOffer !== null || isFormDirty.current) &&
    (!validation.publication.success || readiness !== null)
      ? JSON.stringify({ fieldErrors: publicationErrors, readiness })
      : null;

  useEffect(() => {
    if (publishDiagnostics) {
      console.warn("[VHSBOARD CMS] Publikacja zablokowana.", JSON.parse(publishDiagnostics));
    }
  }, [publishDiagnostics]);

  const invalidateAdminCaches = async (offerSlug: string) => {
    const detailSlugs = new Set([offerSlug]);
    if (!isNew) detailSlugs.add(slug);

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] }),
      ...[...detailSlugs].map((detailSlug) =>
        queryClient.invalidateQueries({ queryKey: ["admin-offer", detailSlug] }),
      ),
    ]);
  };

  const invalidatePublicCaches = async (offer: EditableOffer) => {
    const detailSlugs = new Set([offer.slug, ...(isNew ? [] : [slug])]);
    const kinds = new Set([offer.offerKind ?? "trip", persistedOffer?.offerKind ?? "trip"]);

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["published-offers"] }),
      queryClient.invalidateQueries({ queryKey: homeOffersQueryOptions().queryKey }),
      ...[...detailSlugs].flatMap((detailSlug) =>
        [...kinds].map((kind) =>
          queryClient.invalidateQueries({
            queryKey: publishedOfferQueryOptions(detailSlug, kind).queryKey,
          }),
        ),
      ),
    ]);
  };

  const invalidateImageDependentCaches = async () => {
    if (!persistedOffer) return;

    setActionError(null);
    await Promise.all([
      invalidateAdminCaches(persistedOffer.slug),
      queryClient.invalidateQueries({
        queryKey: ["admin-offer-publish-readiness", persistedOffer.id],
      }),
      invalidatePublicCaches(persistedOffer),
    ]);
  };

  const handleHeroChanged = (heroImagePath: string) => {
    setPersistedOffer((current) => (current ? { ...current, heroImagePath } : current));
    setFormValue((current) => ({ ...current, heroImagePath }));
    setActionError(null);
  };

  const persistInput = async (input: EditableOfferInput) => {
    const offer = persistedOffer
      ? await updateMutation.mutateAsync({ id: persistedOffer.id, input })
      : await createMutation.mutateAsync(input);

    setPersistedOffer(offer);
    isFormDirty.current = false;
    setFormValue(toEditableInput(offer));
    setAttemptedSave(false);
    setEditedFields(new Set());
    setSaved(true);
    await invalidateAdminCaches(offer.slug);
    await queryClient.invalidateQueries({ queryKey: ["admin-offer-publish-readiness", offer.id] });
    return offer;
  };

  const navigateAfterPersistence = async (offer: EditableOffer) => {
    if (offer.slug === slug) return;
    await navigate({ to: "/admin/$slug", params: { slug: offer.slug }, replace: true });
  };

  const handleSaveDraft = async () => {
    setAttemptedSave(true);
    setActionError(null);
    const isPublished = currentStatus === "published";
    const result = isPublished ? validation.publication : validation.draft;
    if (!result.success || (isPublished && (!mediaChecked || hasImageErrors))) return;

    setIsSubmitting(true);
    try {
      const offer = await persistInput(result.data);
      if (isPublished) await invalidatePublicCaches(offer);
      await navigateAfterPersistence(offer);
    } catch (error) {
      setActionError(offerActionMessage(error, "Nie udało się zapisać oferty. Spróbuj ponownie."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!canPublish || !validation.publication.success) return;

    setActionError(null);
    setIsSubmitting(true);
    let savedOffer: EditableOffer | null = null;
    try {
      savedOffer = await persistInput(validation.publication.data);
      const publishedOffer = await statusMutation.mutateAsync({
        id: savedOffer.id,
        status: "published",
      });
      setPersistedOffer(publishedOffer);
      await Promise.all([
        invalidateAdminCaches(publishedOffer.slug),
        invalidatePublicCaches(publishedOffer),
      ]);
      await navigateAfterPersistence(publishedOffer);
    } catch (error) {
      setActionError(
        offerActionMessage(error, "Nie udało się opublikować oferty. Spróbuj ponownie."),
      );
      if (savedOffer) await navigateAfterPersistence(savedOffer);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnpublish = async () => {
    if (!persistedOffer) return;

    setActionError(null);
    setIsSubmitting(true);
    try {
      const draftOffer = await statusMutation.mutateAsync({
        id: persistedOffer.id,
        status: "draft",
      });
      setPersistedOffer(draftOffer);
      setAttemptedSave(false);
      await Promise.all([
        invalidateAdminCaches(draftOffer.slug),
        invalidatePublicCaches(draftOffer),
      ]);
    } catch (error) {
      setActionError(
        offerActionMessage(error, "Nie udało się cofnąć publikacji. Spróbuj ponownie."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    if (!persistedOffer) return;

    const previewPath =
      persistedOffer.offerKind === "day_camp"
        ? `/obozy/${persistedOffer.slug}?preview=true`
        : `/wyjazdy/${persistedOffer.slug}?preview=true`;
    window.open(previewPath, "_blank", "noopener,noreferrer");
  };

  if (!isNew && offerQuery.isPending && persistedOffer === null) {
    return <EditorMessage message="Ładowanie oferty…" />;
  }

  if (!isNew && offerQuery.isError && persistedOffer === null) {
    return (
      <EditorMessage
        message="Nie udało się pobrać oferty."
        isError
        onRetry={() => void offerQuery.refetch()}
      />
    );
  }

  if (!isNew && !offerQuery.isPending && offerQuery.data === null && persistedOffer === null) {
    return <EditorMessage message="Nie znaleziono tej oferty." />;
  }

  return (
    <div className="min-h-screen bg-muted/40 pb-24">
      <header className="sticky top-[var(--development-banner-height,0px)] z-50 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            <Button asChild size="sm" variant="ghost" className="rounded-full">
              <Link to="/admin">
                <ArrowLeft className="mr-1 size-4" aria-hidden="true" /> Oferty
              </Link>
            </Button>
            <span className="font-display text-xl tracking-wide">
              {isNew && persistedOffer === null
                ? "Nowa oferta"
                : formValue.title || "Oferta bez tytułu"}
            </span>
            <Badge variant={currentStatus === "published" ? "default" : "secondary"}>
              {statusLabels[currentStatus]}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <AdminSignOutButton />
            {saved ? <span className="text-xs text-muted-foreground">Zapisano</span> : null}
            <OfferStatusActions
              status={currentStatus}
              isSubmitting={isSubmitting}
              canPublish={canPublish}
              onSaveDraft={handleSaveDraft}
              {...(persistedOffer ? { onPreview: handlePreview } : {})}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {actionError ? (
          <p
            role="alert"
            className="mb-5 rounded-xl bg-destructive/10 p-4 text-sm text-destructive"
          >
            {actionError}
          </p>
        ) : null}
        {readinessQuery.isError ? (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4">
            <p role="alert" className="text-sm text-destructive">
              {readinessCheckErrorMessage}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void readinessQuery.refetch()}
            >
              Sprawdź zdjęcia ponownie
            </Button>
          </div>
        ) : null}
        {isNew && !persistedOffer ? (
          <p className="mb-4 text-sm text-muted-foreground">
            Zapisz szkic, aby dodać zdjęcie główne i opublikować ofertę.
          </p>
        ) : null}
        {readinessQuery.isFetching ? (
          <p role="status" className="mb-4 text-sm text-muted-foreground">
            Sprawdzamy zdjęcia wymagane do publikacji…
          </p>
        ) : null}
        <OfferEditorForm
          value={formValue}
          errors={fieldErrors}
          validationTitle={validationTitle}
          disabled={isSubmitting || currentStatus === "archived"}
          onChange={(value) => {
            isFormDirty.current = true;
            const next = {
              ...value,
              content: normalizeOfferContentV2(value.content, value.offerKind ?? "trip"),
            };
            setFormValue(next);
            setEditedFields((edited) => recordEditedFields(formValue, next, edited));
            setActionError(null);
            setSaved(false);
          }}
          imageManager={
            persistedOffer ? (
              <OfferImageManager
                offerId={persistedOffer.id}
                heroImagePath={persistedOffer.heroImagePath}
                disabled={isSubmitting || currentStatus === "archived"}
                onHeroChanged={handleHeroChanged}
                onImagesChanged={invalidateImageDependentCaches}
              />
            ) : undefined
          }
          resortImageManager={
            persistedOffer ? (
              <OfferImageManager
                offerId={persistedOffer.id}
                heroImagePath={null}
                category="resort_gallery"
                disabled={isSubmitting || currentStatus === "archived"}
                onImagesChanged={invalidateImageDependentCaches}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Najpierw zapisz szkic, aby dodać zdjęcia resortu.
              </p>
            )
          }
          trainingImageManager={
            persistedOffer ? (
              <OfferImageManager
                offerId={persistedOffer.id}
                heroImagePath={null}
                category="training_gallery"
                disabled={isSubmitting || currentStatus === "archived"}
                onImagesChanged={invalidateImageDependentCaches}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Najpierw zapisz szkic, aby dodać zdjęcia szkolenia.
              </p>
            )
          }
          resortMapManager={
            persistedOffer ? (
              <OfferImageManager
                offerId={persistedOffer.id}
                heroImagePath={null}
                category="resort_map"
                disabled={isSubmitting || currentStatus === "archived"}
                onImagesChanged={invalidateImageDependentCaches}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Najpierw zapisz szkic, aby dodać mapę resortu.
              </p>
            )
          }
          accommodationImageManager={
            persistedOffer ? (
              <OfferImageManager
                offerId={persistedOffer.id}
                heroImagePath={null}
                category="accommodation"
                disabled={isSubmitting || currentStatus === "archived"}
                onImagesChanged={invalidateImageDependentCaches}
              />
            ) : undefined
          }
        />
      </main>
    </div>
  );
}

function EditorMessage({
  message,
  isError = false,
  onRetry,
}: {
  message: string;
  isError?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-screen bg-muted/40 px-5 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-background p-8 text-center">
        <p role={isError ? "alert" : "status"} className="text-sm text-muted-foreground">
          {message}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          {onRetry ? (
            <Button type="button" variant="outline" onClick={onRetry}>
              Spróbuj ponownie
            </Button>
          ) : null}
          <Button asChild>
            <Link to="/admin">Wróć do ofert</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
