import { Metadata } from "../types"
import { GoogleBooksApiResult } from "@libs/google/googleBooksApi"

export const parseGoogleMetadata = (
  response: GoogleBooksApiResult
): Omit<Metadata, "type"> => {
  let coverLink: string | undefined

  if (Array.isArray(response.items) && response.items.length > 0) {
    const item = response.items[0]

    if (!item) return {}

    coverLink = item.volumeInfo.imageLinks?.thumbnail?.replace(
      "zoom=1",
      "zoom=2"
    )

    let title = item.volumeInfo.title

    // In case the book is part of series, there is a high chance the volume number will not be present in title
    // the title end up being a generic title for all volumes.
    // In this case we append the volume number to the title
    if (
      item.volumeInfo.seriesInfo?.bookDisplayNumber &&
      !item.volumeInfo.title.includes(`Vol `) &&
      !item.volumeInfo.title.includes(`Vol. `)
    ) {
      title = `${title} Vol ${item.volumeInfo.seriesInfo?.bookDisplayNumber}`
    }

    return {
      authors: item.volumeInfo.authors,
      coverLink,
      description: item.volumeInfo.description,
      formatType: item.volumeInfo.categories.includes("Comics & Graphic Novels")
        ? ["comics", "manga"]
        : ["audio", "book", "comics", "manga"],
      pageCount: item.volumeInfo.pageCount,
      date: item.volumeInfo.publishedDate,
      rating: item.volumeInfo.averageRating,
      title,
      publisher: item.volumeInfo.publisher,
      languages: [item.volumeInfo.language],
      subjects: item.volumeInfo.categories
    }
  }

  return {}
}
