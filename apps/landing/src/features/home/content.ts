import { links } from "@oboku/shared"

export const landingTagline = "Free ebook & comic reader for your cloud library"

export const landingDescription =
  "Read EPUB, comics and PDF in your browser, synced from Google Drive, Dropbox, OneDrive, WebDAV or Synology. Works offline and with KOReader. Free, open source, self-hostable."

const syncProvidersDocumentation = `${links.documentation}/sync-providers`

export const syncProviders = [
  { label: "Google Drive", href: `${syncProvidersDocumentation}/google-drive` },
  { label: "Dropbox", href: `${syncProvidersDocumentation}/dropbox` },
  { label: "OneDrive", href: `${syncProvidersDocumentation}/one-drive` },
  { label: "Synology", href: `${syncProvidersDocumentation}/synology-drive` },
  { label: "WebDAV", href: `${syncProvidersDocumentation}/webdav` },
  { label: "OPDS", href: `${syncProvidersDocumentation}/opds` },
]

export const supportedExtensions = [".epub", ".cbz", ".cbr", ".pdf", ".txt"]
