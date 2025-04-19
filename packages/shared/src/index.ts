export const design = {
  palette: {
    orange: `rgb(225, 100, 50, 1)`,
  },
}

export const links = {
  documentation: `https://docs.oboku.me`,
  documentationSecrets: `https://docs.oboku.me/secrets`,
  documentationWebDAV: `https://docs.oboku.me/guides/webdav`,
  app: `https://app.oboku.me`,
  site: `https://oboku.me`,
  linkedin: `https://www.linkedin.com/in/maxime-bret`,
  github: `https://github.com/mbret/oboku`,
  discord: `https://discord.gg/eB6MrMmmPN`,
  reddit: `https://www.reddit.com/r/oboku/`,
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

export * from "./db/docTypes"
export * from "./db/books"

export * from "./dataSources"
export * from "./sorting"

export { ObokuErrorCode, ObokuSharedError } from "./errors"

export * from "./plugins/file"
export * from "./metadata"
export * from "./sync/reports"
export * from "./utils/objects"
export * from "./utils/difference"
export * from "./utils/truncate"
export * from "./utils/intersection"
export * from "./utils/groupBy"
export * from "./utils/mergeWith"
export * from "./collections"
export * from "./contentType"
export * from "./plugins/webdav"
export * from "./plugins/file"
