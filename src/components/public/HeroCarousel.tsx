import * as React from "react";

import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { getLocalImage, type ResponsiveImageAsset } from "@/lib/images/responsive";
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

const mobileHeroImages: Readonly<Record<string, ResponsiveImageAsset>> = {
  "carousel/1karuzela_snb.png": getLocalImage("hero-mobile/snowboard.jpg"),
  "carousel/2karuzela_oboz1.png": getLocalImage("hero-mobile/oboz-zimowy.jpg"),
  "carousel/3karuzela_surf.png": getLocalImage("hero-mobile/surf.jpg"),
  "carousel/4eventy_karuzela.png": getLocalImage("main/eventy-1.jpg"),
  "carousel/karuzela_oboz2.png": getLocalImage("main/obozy-zima.jpg"),
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
          const position = mobileImageClasses[image.path];
          const portrait = image.responsive ? mobileHeroImages[image.path] : undefined;
          const imageClassName = `h-full w-full object-cover ${position ?? ""}${portrait && position ? " portrait:object-center" : ""}`;
          return (
            <CarouselItem className="h-full pl-0" key={image.path}>
              {image.responsive ? (
                <ResponsiveImage
                  image={image.responsive}
                  sizes={position ? "(max-width: 767px) 1600px, 100vw" : "100vw"}
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
