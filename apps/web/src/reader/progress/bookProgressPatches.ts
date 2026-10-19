import { type BookDocType, ReadingStateState } from "@oboku/shared"
import type { ReadingPosition } from "@prose-reader/core"

export type BookPatch = (old: BookDocType) => BookDocType

type SavedReadingPosition = Pick<
  ReadingPosition,
  "cfi" | "percentageEstimateOfBook"
>

type SavedReadingPositionWithKoreaderForm = SavedReadingPosition & {
  koreaderProgress: string | null
  koreaderDocument: string
}

export const normalizeProgress = (progress: number) =>
  Number(progress.toFixed(4))

export const toSavedReadingPosition = ({
  cfi,
  percentageEstimateOfBook,
}: ReadingPosition): SavedReadingPosition => ({
  cfi,
  percentageEstimateOfBook: normalizeProgress(percentageEstimateOfBook),
})

export const hasPatches = (patches: BookPatch[]) => patches.length > 0

export const composePatches = (patches: BookPatch[]): BookPatch =>
  function applyPatchesInOrder(old) {
    return patches.reduce((book, patch) => patch(book), old)
  }

export const createReadingPositionPatch = ({
  cfi,
  percentageEstimateOfBook,
  koreaderProgress,
  koreaderDocument,
}: SavedReadingPositionWithKoreaderForm): BookPatch =>
  function applyReadingPosition(old) {
    const savedAt = new Date().toISOString()
    const nextReadingState =
      old.readingStateCurrentState === ReadingStateState.Finished
        ? ReadingStateState.Finished
        : ReadingStateState.Reading
    const didReadingStateChange =
      old.readingStateCurrentBookmarkLocation !== cfi ||
      old.readingStateCurrentBookmarkProgressPercent !==
        percentageEstimateOfBook ||
      old.readingStateCurrentState !== nextReadingState
    const hadBookmark = old.readingStateCurrentBookmarkLocation !== null
    const didBookmarkMove =
      hadBookmark && old.readingStateCurrentBookmarkLocation !== cfi

    return {
      ...old,
      readingStateCurrentBookmarkLocation: cfi,
      readingStateCurrentBookmarkProgressPercent: percentageEstimateOfBook,
      readingStateCurrentBookmarkKoreaderProgress: koreaderProgress,
      readingStateCurrentBookmarkKoreaderDocument: koreaderDocument,
      readingStateCurrentState: nextReadingState,
      ...(didReadingStateChange && { readingStateUpdatedAt: savedAt }),
      ...(didBookmarkMove && {
        readingStateCurrentBookmarkLocationUpdatedAt: savedAt,
      }),
    }
  }

export type BookWrite = { old: BookDocType; book: BookDocType }

/** Only the reading position patch dates the bookmark, and only when it moves. */
export const didWriteMoveBookmark = ({ old, book }: BookWrite) =>
  book.readingStateCurrentBookmarkLocationUpdatedAt !==
  old.readingStateCurrentBookmarkLocationUpdatedAt

export const createReachedProgressPatch = (
  reachedProgress: number,
): BookPatch =>
  function applyReachedProgress(old) {
    return { ...old, readingStateReachedProgressPercent: reachedProgress }
  }

export const markBookAsOpened = (old: BookDocType): BookDocType => ({
  ...old,
  readingStateUpdatedAt: new Date().toISOString(),
})

/**
 * Finished is a reading state, not a progress (see `BookDocType`): the bookmark
 * and its progress stay the reading position's, which is short of 1 on the
 * last page, so a finished book can store 0.9.
 */
export const markBookAsFinished = (old: BookDocType): BookDocType => {
  if (old.readingStateCurrentState === ReadingStateState.Finished) return old

  return {
    ...old,
    readingStateCurrentState: ReadingStateState.Finished,
    readingStateUpdatedAt: new Date().toISOString(),
  }
}
