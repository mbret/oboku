import { links } from "@oboku/shared"
import { HomeContent } from "../features/home/HomeContent"
import { landingDescription } from "../features/home/content"

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${links.site}/#website`,
        name: "oboku",
        url: links.site,
      },
      {
        "@type": "WebApplication",
        "@id": `${links.site}/#app`,
        name: "oboku",
        url: links.site,
        installUrl: links.app,
        description: landingDescription,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any device with a web browser",
        isAccessibleForFree: true,
        license: "https://www.gnu.org/licenses/gpl-3.0.html",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: {
          "@type": "Person",
          name: "Maxime Bret",
          url: links.linkedin,
        },
        softwareHelp: {
          "@type": "CreativeWork",
          url: links.documentation,
        },
        sameAs: [links.github, links.reddit],
        featureList: [
          "EPUB, CBZ, CBR, PDF and TXT support",
          "Offline reading",
          "Google Drive sync",
          "Dropbox sync",
          "OneDrive sync",
          "Synology sync",
          "WebDAV sync",
          "E-ink support",
          "KOReader sync server",
          "KOReader progress sync",
          "Self-hosting",
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeContent />
    </>
  )
}
