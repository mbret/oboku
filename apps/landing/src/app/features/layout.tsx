import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Features",
  description:
    "Everything oboku can do: read EPUB, comics, manga and PDF, sync from Google Drive, Dropbox, OneDrive, Synology or WebDAV, read offline on any device, protect private content and self-host it.",
}

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
