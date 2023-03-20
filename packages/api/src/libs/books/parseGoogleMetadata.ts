import { GoogleBooksApiResult } from "../google/googleBooksApi"
import { NormalizedMetadata } from "./types"

export const parseGoogleMetadata = (data: GoogleBooksApiResult) => {
  const normalizedMetadata: Partial<NormalizedMetadata> = {}

  if (Array.isArray(data.items) && data.items.length > 0) {
    const item = data.items[0]

    if (!item) return normalizedMetadata

    normalizedMetadata.creator = item.volumeInfo.authors[0]
    normalizedMetadata.title = item.volumeInfo.title
    normalizedMetadata.date = new Date(item.volumeInfo.publishedDate)
    normalizedMetadata.publisher = item.volumeInfo.publisher
    normalizedMetadata.language = item.volumeInfo.language
    normalizedMetadata.subject = item.volumeInfo.categories

    // In case the book is part of series, there is a high chance the volume number will not be present in title
    // the title end up being a generic title for all volumes.
    // In this case we append the volume number to the title
    if (
      item.volumeInfo.seriesInfo?.bookDisplayNumber &&
      !item.volumeInfo.title.includes(`Vol `) &&
      !item.volumeInfo.title.includes(`Vol. `)
    ) {
      normalizedMetadata.title = `${normalizedMetadata.title} Vol ${item.volumeInfo.seriesInfo?.bookDisplayNumber}`
    }
  }

  return normalizedMetadata
}
