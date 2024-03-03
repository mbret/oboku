export type Metadata = {
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
