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
  intervalMs?: number;
};

const mobileImageClasses: Readonly<Record<string, string>> = {
  "carousel/1karuzela_snb.png": "object-[62%_center] md:object-center",
  "carousel/3karuzela_surf.png": "object-[75%_center] md:object-center",
  "carousel/4eventy_karuzela.png": "object-[68%_center] md:object-center",
};

const HeroCarousel = ({ images, intervalMs = 5_500 }: HeroCarouselProps) => {
  const [api, setApi] = React.useState<CarouselApi>();

  React.useEffect(() => {
    if (!api || images.length < 2) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | undefined;
    const synchronize = () => {
      if (timer !== undefined) window.clearInterval(timer);
      timer = undefined;
      if (!motion.matches && document.visibilityState === "visible") {
        timer = window.setInterval(() => api.scrollNext(), intervalMs);
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
  }, [api, images.length, intervalMs]);

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
                sizes={
                  mobileImageClasses[image.path] ? "(max-width: 767px) 1600px, 100vw" : "100vw"
                }
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                alt=""
                className={`h-full w-full object-cover ${mobileImageClasses[image.path] ?? ""}`}
                data-testid="hero-carousel-slide"
              />
            ) : (
              <img
                alt=""
                className={`h-full w-full object-cover ${mobileImageClasses[image.path] ?? ""}`}
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
