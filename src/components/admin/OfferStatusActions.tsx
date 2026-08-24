import { useRef, useState } from "react";
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
  const isActionInFlight = useRef(false);
  const [isActionPending, setIsActionPending] = useState(false);
  const isEditable = status === "draft" || status === "published";
  const isBusy = isSubmitting || isActionPending;

  const runAction = (action: () => void | Promise<void>) => {
    if (isSubmitting || isActionInFlight.current) {
      return;
    }

    isActionInFlight.current = true;
    setIsActionPending(true);

    const finishAction = () => {
      isActionInFlight.current = false;
      setIsActionPending(false);
    };

    try {
      void Promise.resolve(action()).then(finishAction, finishAction);
    } catch {
      finishAction();
    }
  };

  if (!isEditable) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={isBusy}
        onClick={() => runAction(onSaveDraft)}
      >
        {status === "published" ? "Zapisz" : "Zapisz szkic"}
      </Button>
      {status === "draft" ? (
        <Button type="button" disabled={isBusy || !canPublish} onClick={() => runAction(onPublish)}>
          Opublikuj
        </Button>
      ) : null}
      {status === "published" ? (
        <Button
          type="button"
          variant="secondary"
          disabled={isBusy}
          onClick={() => runAction(onUnpublish)}
        >
          Cofnij publikację
        </Button>
      ) : null}
    </div>
  );
}
