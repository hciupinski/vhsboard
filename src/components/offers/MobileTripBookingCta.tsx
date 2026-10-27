import { Button } from "@/components/ui/button";
import { isValidBookingUrl } from "@/lib/offers/booking-url";

export function MobileTripBookingCta({ bookingUrl }: { bookingUrl: string }) {
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
        <Button asChild size="lg" className="h-12 w-full rounded-full">
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
            Zapisz się
          </a>
        </Button>
      </aside>
    </>
  );
}
