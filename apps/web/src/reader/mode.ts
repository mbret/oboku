import { generatePath } from "react-router"
import { ROUTES } from "../navigation/routes"

const READER_MODE_PARAM = "mode"

/**
 * Preview lets the user see how a book looks, for example after the optimize
 * flow rebuilt its file. The "Test" button of that flow opens it.
 *
 * Preview is not a reading session. The book in preview can be broken, or not
 * what the user wants to keep. Its file can change again, and its hash changes
 * with it. So preview reads and writes none of the user's reading data for the
 * book, and shows no control for it: see {@link getUsesReadingData}.
 */
const READER_PREVIEW_MODE = "preview"

export const getReaderPreviewRoute = (bookId: string) => {
  const path = generatePath(ROUTES.READER, { id: bookId })
  const searchParams = new URLSearchParams({
    [READER_MODE_PARAM]: READER_PREVIEW_MODE,
  })

  return `${path}?${searchParams.toString()}`
}

/**
 * Whether the reader reads and writes the user's reading data for the book:
 * `true` in a reading session, `false` in preview.
 *
 * Reading data is what reading the book records: its reading position and
 * progress, its KOReader position, its reading state, its annotations and page
 * bookmarks, and the record of the book as being read on this device.
 *
 * A reader feature that reads or writes reading data, or shows a control for
 * it, runs only when this is `true`. A feature that changes only how the book
 * looks runs in preview too, so that preview shows the book as a reading
 * session does.
 */
export const getUsesReadingData = (searchParams: URLSearchParams) =>
  searchParams.get(READER_MODE_PARAM) !== READER_PREVIEW_MODE
