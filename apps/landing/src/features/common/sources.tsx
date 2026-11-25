import {
  DnsRounded,
  HttpRounded,
  RssFeedRounded,
  SdStorageRounded,
} from "@mui/icons-material"
import { links } from "@oboku/shared"
import Image, { type StaticImageData } from "next/image"
import type { ReactElement } from "react"
import dropboxLogo from "./source-logos/dropbox.svg"
import googleDriveLogo from "./source-logos/google-drive.svg"
import oneDriveLogo from "./source-logos/one-drive.svg"
import synologyDriveLogo from "./source-logos/synology-drive.png"
import { WebDavIcon } from "./WebDavIcon"

const sourceLogoSize = 18

function SourceLogoImage({ src }: { src: StaticImageData }) {
  return (
    <Image src={src} alt="" width={sourceLogoSize} height={sourceLogoSize} />
  )
}

type SourceChip = {
  label: string
  href: string
  icon: ReactElement
}

const sourcesDocumentation = `${links.documentation}/sources`

export const sources: SourceChip[] = [
  {
    label: "Google Drive",
    href: `${sourcesDocumentation}/google-drive`,
    icon: <SourceLogoImage src={googleDriveLogo} />,
  },
  {
    label: "Dropbox",
    href: `${sourcesDocumentation}/dropbox`,
    icon: <SourceLogoImage src={dropboxLogo} />,
  },
  {
    label: "OneDrive",
    href: `${sourcesDocumentation}/one-drive`,
    icon: <SourceLogoImage src={oneDriveLogo} />,
  },
  {
    label: "Synology Drive",
    href: `${sourcesDocumentation}/synology-drive`,
    icon: <SourceLogoImage src={synologyDriveLogo} />,
  },
  {
    label: "WebDAV",
    href: `${sourcesDocumentation}/webdav`,
    icon: <WebDavIcon />,
  },
  {
    label: "OPDS",
    href: `${sourcesDocumentation}/opds`,
    icon: <RssFeedRounded />,
  },
  {
    label: "Server files",
    href: `${sourcesDocumentation}/server-files-self-host`,
    icon: <DnsRounded />,
  },
  {
    label: "Web address",
    href: `${sourcesDocumentation}/web-address`,
    icon: <HttpRounded />,
  },
  {
    label: "Device",
    href: `${sourcesDocumentation}/device`,
    icon: <SdStorageRounded />,
  },
]
