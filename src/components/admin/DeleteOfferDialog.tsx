import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type Props = {
  offerTitle: string;
  isArchiving: boolean;
  onConfirm: () => void | Promise<void>;
};

export function DeleteOfferDialog({ offerTitle, isArchiving, onConfirm }: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" disabled={isArchiving}>
          Archiwizuj ofertę
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archiwizować ofertę?</AlertDialogTitle>
          <AlertDialogDescription>
            Oferta „{offerTitle}” przestanie być widoczna publicznie, ale nie zostanie usunięta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={isArchiving}>
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button type="button" variant="destructive" disabled={isArchiving} onClick={onConfirm}>
              Archiwizuj
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
