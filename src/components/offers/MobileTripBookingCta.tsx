import { BookingButton } from "./BookingButton";
import { isValidBookingUrl } from "@/lib/offers/booking-url";

export function MobileTripBookingCta({
  bookingUrl,
  disabled = false,
}: {
  bookingUrl: string;
  disabled?: boolean;
}) {
  if (!isValidBookingUrl(bookingUrl)) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="h-[calc(5rem+env(safe-area-inset-bottom))] shrink-0 lg:hidden"
      />
      <aside
        aria-label="Zapisy na wyjazd"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
      >
        <BookingButton href={bookingUrl} disabled={disabled} className="h-12 w-full rounded-full">
          Zapisz się
        </BookingButton>
      </aside>
    </>
  );
}
