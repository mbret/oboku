export type Metadata = {
  title?: string
  authors?: string[]
  description?: string
  formatType?: ("book" | "comics" | "manga" | "audio")[]
  rating?: number
  coverLink?: string
  pageCount?: number
  date?: string
  size?: string
  contentType?: string
  languages?: string[]
  subjects?: string[]
  isbn?: string
  publisher?: string | undefined
  rights?: string | undefined
  /**
   * googleBookApi: Metadata scrapped through google book api
   * link: metadata scrapped from the current link
   */
  type: "googleBookApi" | "link"
}
