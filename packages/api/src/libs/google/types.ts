type YEAR = string

type Category = "Comics & Graphic Novels" | "Fiction" | "Juvenile Fiction"
type ReadingMode = { text: boolean; image: boolean }

export type Item = {
  kind: string
  id: string
  etag: string
  selfLink: string
  volumeInfo: {
    title: string
    authors: string[]
    publisher: string
    publishedDate: YEAR
    language: "de" | "fr"
    pageCount?: number
    categories?: Category[]
    averageRating?: number
    readingModes?: ReadingMode[]
    description?: string
    imageLinks?: { thumbnail?: string; smallThumbnails?: string }
    maturityRating?: "NOT_MATURE"
    seriesInfo?: {
      bookDisplayNumber?: string // number as string
    }
  }
}
