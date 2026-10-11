import type { ComponentPropsWithoutRef } from "react";
import type { ResponsiveImageAsset } from "@/lib/images/responsive";

type Props = { image: ResponsiveImageAsset; sizes: string } & Omit<
  ComponentPropsWithoutRef<"img">,
  "src" | "srcSet" | "width" | "height"
>;
export function ResponsiveImage({ image, sizes, alt, ...props }: Props) {
  return (
    <picture className="contents">
      <source type="image/avif" srcSet={image.avifSrcSet} sizes={sizes} />
      <source type="image/webp" srcSet={image.webpSrcSet} sizes={sizes} />
      <img
        {...props}
        alt={alt}
        src={image.src}
        srcSet={image.webpSrcSet}
        sizes={sizes}
        width={image.width}
        height={image.height}
      />
    </picture>
  );
}
