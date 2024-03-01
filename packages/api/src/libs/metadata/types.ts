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
  creators?: string[]
  shouldDownload?: boolean
  isbn?: string
  publisher?: string | undefined
  rights?: string | undefined
  subject?: string[] | null
}
