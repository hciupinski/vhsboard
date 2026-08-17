import { Button } from "@/components/ui/button";
import type { OfferStatus } from "@/lib/offers/types";

type Props = {
  status: OfferStatus;
  isSubmitting: boolean;
  canPublish: boolean;
  onSaveDraft: () => void | Promise<void>;
  onPublish: () => void | Promise<void>;
  onUnpublish: () => void | Promise<void>;
};

export function OfferStatusActions({
  status,
  isSubmitting,
  canPublish,
  onSaveDraft,
  onPublish,
  onUnpublish,
}: Props) {
  const isEditable = status === "draft" || status === "published";

  if (!isEditable) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" disabled={isSubmitting} onClick={onSaveDraft}>
        Zapisz szkic
      </Button>
      {status === "draft" ? (
        <Button type="button" disabled={isSubmitting || !canPublish} onClick={onPublish}>
          Opublikuj
        </Button>
      ) : null}
      {status === "published" ? (
        <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onUnpublish}>
          Cofnij publikację
        </Button>
      ) : null}
    </div>
  );
}
