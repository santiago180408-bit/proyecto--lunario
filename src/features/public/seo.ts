import type { Metadata } from "next";
import { business, faq } from "./content";

// SITE_URL is the configured public origin. Pages supplies its real build URL
// for preview deployments when a definitive SITE_URL has not been configured.
const configured = process.env.SITE_URL || process.env.CF_PAGES_URL;
export const siteUrl = configured ? new URL(configured).origin : undefined;
const title = "Lunario Café | Café, coworking y reservaciones en Cd. Sahagún";
const description =
  "Conoce Lunario Café en Cd. Sahagún, consulta su menú, pide para recoger, solicita una mesa y explora sus espacios de coworking.";
export const landingMetadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title,
  description,
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl ? `${siteUrl}/` : "/" },
  openGraph: {
    title,
    description,
    siteName: business.name,
    locale: "es_MX",
    type: "website",
    ...(siteUrl
      ? {
          url: `${siteUrl}/`,
          images: [
            {
              url: "/media/lunario-og.jpg",
              width: 1200,
              height: 630,
              alt: "Café con arte latte de Lunario",
            },
          ],
        }
      : {}),
  },
};
export function structuredData() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CafeOrCoffeeShop",
      name: business.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Pedro de Ponce #29, Col. Sidena",
        addressLocality: "Cd. Sahagún",
        addressRegion: "Hidalgo",
        addressCountry: "MX",
      },
      telephone: "+52 771 181 1972",
      email: business.email,
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "07:00",
        closes: "23:00",
      },
      ...(siteUrl
        ? {
            url: `${siteUrl}/`,
            logo: `${siteUrl}/brand/lunario-logo-circular.png`,
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];
}
