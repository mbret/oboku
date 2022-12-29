export const READER_ACCEPTED_EXTENSIONS = {
  "text/plain": [".txt"],
  "application/x-cbz": [".cbz"],
  "application/zip": [".epub"],
  "application/epub+zip": [".epub"],
  "application/x-cbr": [".cbr"]
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
  linkedin: `https://www.linkedin.com/in/maxime-bret`
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

import * as validators from "./validators"

export * as crypto from "./crypto"

export { ObokuErrorCode, ObokuSharedError } from "./errors"

export { validators }
