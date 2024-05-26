export const READER_ACCEPTED_EXTENSIONS = {
  "text/plain": [".txt"],
  "application/x-cbz": [".cbz"],
  "application/zip": [".epub"],
  "application/epub+zip": [".epub"],
  "application/x-cbr": [".cbr"],
  "application/x-rar": [".cbr"]
}
export const READER_SUPPORTED_MIME_TYPES = Object.keys(
  READER_ACCEPTED_EXTENSIONS
)
export const READER_SUPPORTED_EXTENSIONS = Object.values(
  READER_ACCEPTED_EXTENSIONS
).reduce((prev, next) => [...prev, ...next], [])

export const design = {
  palette: {
    orange: `rgb(225, 100, 50, 1)`
  }
}

export const links = {
  documentation: `https://docs.oboku.me`,
  app: `https://app.oboku.me`,
  site: `https://oboku.me`,
  linkedin: `https://www.linkedin.com/in/maxime-bret`,
  github: `https://github.com/mbret/oboku`,
  discord: `https://discord.gg/eB6MrMmmPN`,
  reddit: `https://www.reddit.com/r/oboku/`
}

export type OPF = {
  package?: {
    manifest?: {
      item?: {
        id?: string
        href?: string
        "media-type"?: string
      }[]
    }
    metadata?: {
      "dc:title"?:
        | string
        | {
            "#text": string
          }
      title?: any
      "dc:date"?: any
      "dc:creator"?: { "#text"?: string } | { "#text"?: string }[]
      "dc:subject"?: any
      "dc:language"?: any
      "dc:publisher"?: { "#text": string; id: string } | string
      "dc:rights"?: any
      meta?:
        | {
            name?: "cover" | "unknown"
            content?: string
          }
        | {
            name?: "cover" | "unknown"
            content?: string
          }[]
    }
  }
}

export * as directives from "./directives"

export * from "./docTypes"

export * from "./dataSources"
export * from "./sorting"

export * as crypto from "./crypto"

export { ObokuErrorCode, ObokuSharedError } from "./errors"

export * from "./plugin-imhentai-shared"

export * from "./plugins/file"
export * from "./metadata"
