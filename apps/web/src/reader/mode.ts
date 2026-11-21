import { generatePath } from "react-router"
import { ROUTES } from "../navigation/routes"

const READER_MODE_PARAM = "mode"
const READER_PREVIEW_MODE = "preview"

/**
 * The route that opens a book in preview.
 *
 * Preview lets the user see how a book looks, for example after the optimize
 * flow rebuilt its file. Preview is not a reading session. The book in preview
 * can be broken, or not what the user wants to keep. Its file can change
 * again, and its KOReader document, the digest of that file, changes with it.
 * So preview reads and writes none of the user's reading data for the book,
 * and shows no control for it: see {@link getUsesReadingData}.
 */
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
 * Reading data is what a reading session saves for the book:
 * - its reading position and progress;
 * - its position on the KOReader sync server;
 * - its reading state;
 * - its annotations and page bookmarks;
 * - the book that the app offers to reopen on this device.
 *
 * A reader feature that reads or writes reading data, or shows a control for
 * it, runs only when this is `true`. That includes an enhancer of the reader:
 * react-reader shows the annotation controls of any reader that has the
 * annotations enhancer. Every other feature runs in preview too, so that
 * preview shows the book as a reading session does.
 */
export const getUsesReadingData = (searchParams: URLSearchParams) =>
  searchParams.get(READER_MODE_PARAM) !== READER_PREVIEW_MODE
