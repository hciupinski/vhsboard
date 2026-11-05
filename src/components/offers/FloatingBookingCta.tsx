import { useEffect, useState, type RefObject } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isValidBookingUrl } from "@/lib/offers/booking-url";

export function FloatingBookingCta({
  cardRef,
  href,
  label,
  showOnMobile = false,
}: {
  cardRef: RefObject<HTMLElement | null>;
  href: string;
  label: string;
  showOnMobile?: boolean;
}) {
  const [pastCard, setPastCard] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const isAnchor = href === "#turnusy";

  useEffect(() => {
    const card = cardRef.current;
    if (!card || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setPastCard(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    });
    observer.observe(card);
    return () => observer.disconnect();
  }, [cardRef]);

  useEffect(() => {
    const footer = document.querySelector("[data-trip-detail] footer");
    if (!footer || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setFooterVisible(entry.boundingClientRect.top < window.innerHeight);
    });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () =>
      setOverlayOpen(
        !!document.querySelector(
          '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], #cookie-consent-heading',
        ),
      );
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-state"],
    });
    return () => observer.disconnect();
  }, []);

  if (!pastCard || overlayOpen || footerVisible || (!isAnchor && !isValidBookingUrl(href)))
    return null;
  return (
    <aside
      aria-label="Szybki dostęp do zapisów"
      className={`fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2 ${showOnMobile ? "" : "hidden lg:block"}`}
    >
      <Button
        asChild
        size="lg"
        className="rounded-full shadow-warm lg:h-14 lg:px-10 lg:text-base lg:uppercase motion-safe:animate-[booking-cta-pulse_5s_ease-in-out_infinite]"
      >
        <a href={href} {...(!isAnchor ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {label} <ArrowUpRight aria-hidden="true" className="size-4" />
        </a>
      </Button>
    </aside>
  );
}
