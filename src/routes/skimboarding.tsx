import { createFileRoute } from "@tanstack/react-router";

import { SkimboardingOffer } from "@/components/events/SkimboardingOffer";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { createPageMetadata } from "@/lib/seo";
import { SOCIAL_IMAGES } from "@/lib/social-images";

export const Route = createFileRoute("/skimboarding")({
  head: () =>
    createPageMetadata({
      socialImage: SOCIAL_IMAGES.events,
      path: "/skimboarding",
      title: "Tor skimboardowy na eventy | VHSBOARD",
      description: "Wynajem toru skimboardowego na eventy w całej Polsce z obsługą VHSBOARD.",
    }),
  component: SkimboardingPage,
});

function SkimboardingPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <PublicHeader />
      <SkimboardingOffer />
      <PublicFooter />
    </div>
  );
}
