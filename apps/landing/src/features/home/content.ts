import { links } from "@oboku/shared"

export const landingTagline = "Free ebook & comic reader for your cloud library"

export const landingDescription =
  "Read EPUB, comics and PDF in your browser, synced from Google Drive, Dropbox, OneDrive, WebDAV or Synology. Works offline and with KOReader. Free, open source, self-hostable."

const sourcesDocumentation = `${links.documentation}/sources`

export const sources = [
  { label: "Google Drive", href: `${sourcesDocumentation}/google-drive` },
  { label: "Dropbox", href: `${sourcesDocumentation}/dropbox` },
  { label: "OneDrive", href: `${sourcesDocumentation}/one-drive` },
  { label: "Synology", href: `${sourcesDocumentation}/synology-drive` },
  { label: "WebDAV", href: `${sourcesDocumentation}/webdav` },
  { label: "OPDS", href: `${sourcesDocumentation}/opds` },
]

export const supportedExtensions = [".epub", ".cbz", ".cbr", ".pdf", ".txt"]
