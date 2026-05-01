import type { GoogleBookApiMetadata } from "@oboku/shared"
import { extractDateComponents } from "../extractDateComponents"
import type { GoogleBooksApiVolumesResponseData } from "src/lib/google/googleBooksApi"

/**
 * Google Books cover URLs look like:
 *   http://books.google.com/books/content?id=XXX&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api
 *
 * - `zoom=0` returns the largest version Google has (often ~1200px tall vs
 *   ~200px for `zoom=1`).
 * - Removing `&edge=curl` drops the fake page-curl shadow.
 * - The API serves http by default; force https to avoid mixed-content issues.
 */
const upgradeGoogleCoverUrl = (url: string | undefined) => {
  if (!url) return url

  return url
    .replace(/^http:\/\//, "https://")
    .replace(/([?&])zoom=\d+/, "$1zoom=0")
    .replace(/&edge=curl/, "")
}

export const parseGoogleMetadata = (
  response: Pick<GoogleBooksApiVolumesResponseData, "items">,
): Omit<GoogleBookApiMetadata, "type"> => {
  let coverLink: string | undefined

  if (Array.isArray(response.items) && response.items.length > 0) {
    const item = response.items[0]

    if (!item) return {}

    // lookup highest available resolution, then upgrade the URL to ask
    // Google for the largest version it has (zoom=0) without the page-curl
    // overlay. This works even when only `thumbnail` is provided.
    const imageLinks = item.volumeInfo.imageLinks ?? {}
    const rawCover =
      imageLinks.extraLarge ??
      imageLinks.large ??
      imageLinks.medium ??
      imageLinks.small ??
      imageLinks.thumbnail ??
      imageLinks.smallThumbnail
    coverLink = upgradeGoogleCoverUrl(rawCover)

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
      formatType: item.volumeInfo.categories?.includes(
        "Comics & Graphic Novels",
      )
        ? ["comics", "manga"]
        : ["audio", "book", "comics", "manga"],
      pageCount: item.volumeInfo.pageCount,
      date: extractDateComponents(item.volumeInfo.publishedDate),
      rating: item.volumeInfo.averageRating,
      title,
      publisher: item.volumeInfo.publisher,
      languages: [item.volumeInfo.language],
      subjects: item.volumeInfo.categories,
    }
  }

  return {}
}
