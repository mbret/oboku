import type { BookTitleFormat } from "@oboku/shared"

/** How the API words what the metadata merge adds to a book's title. */
export const BOOK_TITLE_FORMAT: BookTitleFormat = {
  formatVolumeTitle(title, position) {
    return `${title} Vol ${position}`
  },
}
