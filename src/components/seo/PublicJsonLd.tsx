import { canonicalUrl } from "@/lib/seo";
import { getPublicSiteConfig } from "@/lib/site-config";
import type { PublicOffer } from "@/lib/offers/types";

import { JsonLd } from "./JsonLd";

type PublicJsonLdProps = {
  path: string;
  label: string;
  includeSite?: boolean;
  offer?: PublicOffer;
};

const isHttpsUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

export function PublicJsonLd({ path, label, includeSite = false, offer }: PublicJsonLdProps) {
  const config = getPublicSiteConfig();
  const siteUrl = canonicalUrl("/");
  const breadcrumbs = [
    { name: config.businessName, item: siteUrl },
    ...(path === "/" ? [] : [{ name: label, item: canonicalUrl(path) }]),
  ];
  const schemas: unknown[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((breadcrumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: breadcrumb.name,
        item: breadcrumb.item,
      })),
    },
  ];

  if (includeSite) {
    schemas.unshift(
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: config.businessName,
        url: siteUrl,
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: config.businessName,
        url: siteUrl,
        email: config.contactEmail,
        telephone: config.contactPhone,
        taxID: config.businessNip,
        identifier: config.businessRegon,
        address: {
          "@type": "PostalAddress",
          streetAddress: config.businessStreet,
          postalCode: config.businessPostalCode,
          addressLocality: config.businessCity,
          addressCountry: "PL",
        },
      },
    );
  }

  if (offer) {
    const hasValidOffer =
      offer.priceFrom > 0 && offer.currency === "PLN" && isHttpsUrl(offer.bookingUrl);
    schemas.push({
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: offer.title,
      description: offer.shortDescription,
      url: canonicalUrl(path),
      ...(hasValidOffer
        ? {
            offers: {
              "@type": "Offer",
              price: offer.priceFrom,
              priceCurrency: offer.currency,
              url: offer.bookingUrl,
            },
          }
        : {}),
    });
  }

  return <JsonLd data={schemas} />;
}
