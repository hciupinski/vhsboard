import type { ComponentPropsWithoutRef } from "react";
import type { ResponsiveImageAsset } from "@/lib/images/responsive";

type Props = {
  image: ResponsiveImageAsset;
  sizes: string;
  artDirection?: readonly { media: string; image: ResponsiveImageAsset; sizes?: string }[];
} & Omit<ComponentPropsWithoutRef<"img">, "src" | "srcSet" | "width" | "height">;
export function ResponsiveImage({ image, sizes, artDirection, alt, ...props }: Props) {
  return (
    <picture className="contents">
      {artDirection?.flatMap(({ media, image: variant, sizes: variantSizes = sizes }) => [
        <source
          key={`${media}-avif`}
          media={media}
          type="image/avif"
          srcSet={variant.avifSrcSet}
          sizes={variantSizes}
        />,
        <source
          key={`${media}-webp`}
          media={media}
          type="image/webp"
          srcSet={variant.webpSrcSet}
          sizes={variantSizes}
        />,
      ])}
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
