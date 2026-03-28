import { links } from "@oboku/shared"
import { HomeContent } from "../features/home/HomeContent"
import { landingSubtitle } from "../features/home/content"

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "oboku",
    url: links.site,
    description: landingSubtitle,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any device with a web browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "EPUB, CBZ, CBR, PDF support",
      "Offline reading",
      "Google Drive sync",
      "Dropbox sync",
      "Synology sync",
      "WebDAV sync",
      "E-ink support",
      "Self-hosting",
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: standard Next.js pattern for JSON-LD structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeContent />
    </>
  )
}
