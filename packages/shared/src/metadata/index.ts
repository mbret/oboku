export type BookMetadata = {
  title?: string
  authors?: string[]
  description?: string
  formatType?: ("book" | "comics" | "manga" | "audio")[]
  rating?: number
  coverLink?: string
  pageCount?: number
  contentType?: string
  date?: { year?: number; month?: number; day?: number }
  size?: string
  languages?: string[]
  subjects?: string[]
  isbn?: string
  publisher?: string | undefined
  rights?: string | undefined
  /**
   * googleBookApi: Metadata scrapped through google book api
   * link: metadata scrapped from the current link
   * file: metadata scrapped from the file itself.
   * user: metadata from user. highest priority
   *
   * priority order:
   * [user, file, ..., link]
   */
  type: "googleBookApi" | "link" | "file" | "user" | "deprecated"
}

export type CollectionMetadata = {
  title?:
    | string
    | {
        en?: string
        es?: string
        ru?: string
        "ja-ro"?: string
      }
  aliases?: string[]
  authors?: string[]
  description?: string
  numberOfIssues?: number
  firstIssue?: {}
  startYear?: number
  publisherName?: string
  rating?: number
  cover?: {
    uri: string
    createdAt?: string
    updatedAt?: string
  }
  status?: "completed" | "ongoing" | "unknown"
  /**
   * googleBookApi: Metadata scrapped through google book api
   * link: metadata scrapped from the current link
   * file: metadata scrapped from the file itself.
   * user: metadata from user. highest priority
   *
   * priority order:
   * [user, file, ..., link]
   */
  type:
    | "googleBookApi"
    | "link"
    | "user"
    | "biblioreads"
    | "comicvine"
    | "mangaupdates"
    | "mangadex"
}

export const COLLECTION_METADATA_LOCK_MN = 5
