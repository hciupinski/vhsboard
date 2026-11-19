import * as React from "react";

import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { ResponsiveImageAsset } from "@/lib/images/responsive";
import { ResponsiveImage } from "./ResponsiveImage";

export type HeroCarouselImage = {
  readonly path: string;
  readonly src: string;
  readonly responsive?: ResponsiveImageAsset;
  readonly portrait?: ResponsiveImageAsset;
};

type HeroCarouselProps = {
  images: readonly HeroCarouselImage[];
  intervalMs?: number;
};

const mobileHeroMedia = "(width < 1024px) and (orientation: portrait)";

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
        {images.map((image, index) => {
          const portrait = image.portrait;
          const imageClassName = "h-full w-full object-cover";
          return (
            <CarouselItem className="h-full pl-0" key={image.path}>
              {image.responsive ? (
                <ResponsiveImage
                  image={image.responsive}
                  sizes="100vw"
                  artDirection={
                    portrait
                      ? [
                          {
                            media: mobileHeroMedia,
                            image: portrait,
                            sizes: `max(100vw, ${Math.ceil((portrait.width / portrait.height) * 100)}svh)`,
                          },
                        ]
                      : []
                  }
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  alt=""
                  className={imageClassName}
                  data-testid="hero-carousel-slide"
                />
              ) : (
                <img
                  alt=""
                  className={imageClassName}
                  data-testid="hero-carousel-slide"
                  src={image.src}
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                />
              )}
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
};

export { HeroCarousel };
