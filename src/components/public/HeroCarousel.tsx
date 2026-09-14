import * as React from "react";

import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { PortalCarouselImage } from "@/lib/portal-carousel/types";

type HeroCarouselProps = {
  images: readonly PortalCarouselImage[];
};

const HeroCarousel = ({ images }: HeroCarouselProps) => {
  const [api, setApi] = React.useState<CarouselApi>();

  React.useEffect(() => {
    if (
      !api ||
      images.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = window.setInterval(() => api.scrollNext(), 7_000);

    return () => window.clearInterval(timer);
  }, [api, images.length]);

  return (
    <Carousel
      aria-hidden="true"
      className="absolute inset-0 [&>div]:h-full"
      data-testid="hero-carousel"
      interactive={false}
      opts={{ loop: true }}
      setApi={setApi}
    >
      <CarouselContent className="ml-0 h-full">
        {images.map((image) => (
          <CarouselItem className="h-full pl-0" key={image.path}>
            <img
              alt=""
              className="h-full w-full object-cover"
              data-testid="hero-carousel-slide"
              src={image.src}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export { HeroCarousel };
