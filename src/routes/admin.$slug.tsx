import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { AdminGuard, AdminSignOutButton } from "@/components/admin/AdminGuard";
import { OfferEditorForm } from "@/components/admin/OfferEditorForm";
import { OfferStatusActions } from "@/components/admin/OfferStatusActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createEmptyEditableOfferInput,
  editorOfferInputSchema,
  getEditorFieldErrors,
  type EditableOffer,
  type EditableOfferInput,
} from "@/lib/offers/editor-schema";
import type { OfferStatus } from "@/lib/offers/types";

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

const statusLabels: Record<OfferStatus, string> = {
  draft: "Szkic",
  published: "Opublikowana",
  archived: "Zarchiwizowana",
};

const toEditableInput = ({ id: _id, status: _status, ...input }: EditableOffer) => input;

const getAdminOffer = async (slug: string) => {
  const repository = await import("@/lib/offers/admin-repository");
  return repository.getAdminOffer(slug);
};

const createOffer = async (input: EditableOfferInput) => {
  const repository = await import("@/lib/offers/admin-repository");
  return repository.createOffer(input);
};

const updateOffer = async (id: string, input: EditableOfferInput) => {
  const repository = await import("@/lib/offers/admin-repository");
  return repository.updateOffer(id, input);
};

const setOfferStatus = async (id: string, status: "draft" | "published") => {
  const repository = await import("@/lib/offers/admin-repository");
  return repository.setOfferStatus(id, status);
};

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
  const [formValue, setFormValue] = useState<EditableOfferInput>(() =>
    createEmptyEditableOfferInput(),
  );
  const [persistedOffer, setPersistedOffer] = useState<EditableOffer | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const offerQuery = useQuery({
    queryKey: ["admin-offer", slug],
    queryFn: () => getAdminOffer(slug),
    enabled: !isNew,
  });

  useEffect(() => {
    if (isNew || !offerQuery.data) return;

    setPersistedOffer(offerQuery.data);
    setFormValue(toEditableInput(offerQuery.data));
  }, [isNew, offerQuery.data]);

  const createMutation = useMutation({ mutationFn: createOffer });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: EditableOfferInput }) =>
      updateOffer(id, input),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "draft" | "published" }) =>
      setOfferStatus(id, status),
  });
  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || statusMutation.isPending;
  const currentStatus = persistedOffer?.status ?? "draft";

  const validateForm = () => {
    const result = editorOfferInputSchema.safeParse(formValue);
    if (!result.success) {
      setFieldErrors(getEditorFieldErrors(result.error));
      setActionError("Popraw oznaczone pola przed zapisaniem oferty.");
      return null;
    }

    setFieldErrors({});
    setActionError(null);
    return result.data;
  };

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

  const invalidatePublicCaches = async (offerSlug: string) => {
    const detailSlugs = new Set([offerSlug]);
    if (!isNew) detailSlugs.add(slug);

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["published-offers"] }),
      ...[...detailSlugs].map((detailSlug) =>
        queryClient.invalidateQueries({ queryKey: ["published-offer", detailSlug] }),
      ),
    ]);
  };

  const persistInput = async (input: EditableOfferInput) => {
    const offer = persistedOffer
      ? await updateMutation.mutateAsync({ id: persistedOffer.id, input })
      : await createMutation.mutateAsync(input);

    setPersistedOffer(offer);
    setFormValue(toEditableInput(offer));
    setSaved(true);
    await invalidateAdminCaches(offer.slug);
    return offer;
  };

  const navigateAfterFirstSave = async (offer: EditableOffer) => {
    if (!isNew) return;
    await navigate({ to: "/admin/$slug", params: { slug: offer.slug }, replace: true });
  };

  const handleSaveDraft = async () => {
    const input = validateForm();
    if (!input) return;

    try {
      const offer = await persistInput(input);
      await navigateAfterFirstSave(offer);
    } catch {
      setActionError("Nie udało się zapisać oferty. Spróbuj ponownie.");
    }
  };

  const handlePublish = async () => {
    const input = validateForm();
    if (!input) return;

    let savedOffer: EditableOffer | null = null;
    try {
      savedOffer = await persistInput(input);

      const statusValidation = editorOfferInputSchema.safeParse(formValue);
      if (!statusValidation.success) {
        setFieldErrors(getEditorFieldErrors(statusValidation.error));
        setActionError("Popraw oznaczone pola przed opublikowaniem oferty.");
        return;
      }

      const publishedOffer = await statusMutation.mutateAsync({
        id: savedOffer.id,
        status: "published",
      });
      setPersistedOffer(publishedOffer);
      setSaved(true);
      await invalidatePublicCaches(publishedOffer.slug);
      await navigateAfterFirstSave(publishedOffer);
    } catch {
      setActionError("Nie udało się opublikować oferty. Spróbuj ponownie.");
      if (savedOffer) await navigateAfterFirstSave(savedOffer);
    }
  };

  const handleUnpublish = async () => {
    const input = validateForm();
    if (!input || !persistedOffer) return;

    try {
      const draftOffer = await statusMutation.mutateAsync({
        id: persistedOffer.id,
        status: "draft",
      });
      setPersistedOffer((current) =>
        current ? { ...current, status: draftOffer.status } : draftOffer,
      );
      setSaved(true);
      await Promise.all([
        invalidateAdminCaches(draftOffer.slug),
        invalidatePublicCaches(draftOffer.slug),
      ]);
    } catch {
      setActionError("Nie udało się cofnąć publikacji. Spróbuj ponownie.");
    }
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
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur">
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
              canPublish
              onSaveDraft={handleSaveDraft}
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
        <OfferEditorForm
          value={formValue}
          errors={fieldErrors}
          disabled={isSubmitting || currentStatus === "archived"}
          onChange={(value) => {
            setFormValue(value);
            setActionError(null);
            setSaved(false);
          }}
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
