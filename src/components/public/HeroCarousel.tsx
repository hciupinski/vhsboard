import * as React from "react";

import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { PortalCarouselImage } from "@/lib/portal-carousel/types";
import { ResponsiveImage } from "./ResponsiveImage";

type HeroCarouselProps = {
  images: readonly PortalCarouselImage[];
};

const HeroCarousel = ({ images }: HeroCarouselProps) => {
  const [api, setApi] = React.useState<CarouselApi>();

  React.useEffect(() => {
    if (!api || images.length < 2) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | undefined;
    const synchronize = () => {
      if (timer !== undefined) window.clearInterval(timer);
      timer = undefined;
      if (!motion.matches && document.visibilityState === "visible") {
        timer = window.setInterval(() => api.scrollNext(), 7_000);
      }
    };
    motion.addEventListener("change", synchronize);
    document.addEventListener("visibilitychange", synchronize);
    synchronize();
    return () => {
      if (timer !== undefined) window.clearInterval(timer);
      motion.removeEventListener("change", synchronize);
      document.removeEventListener("visibilitychange", synchronize);
    };
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
        {images.map((image, index) => (
          <CarouselItem className="h-full pl-0" key={image.path}>
            {image.responsive ? (
              <ResponsiveImage
                image={image.responsive}
                sizes="100vw"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                alt=""
                className="h-full w-full object-cover"
                data-testid="hero-carousel-slide"
              />
            ) : (
              <img
                alt=""
                className="h-full w-full object-cover"
                data-testid="hero-carousel-slide"
                src={image.src}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
              />
            )}
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export { HeroCarousel };
