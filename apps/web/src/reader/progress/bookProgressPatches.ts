import { type BookDocType, ReadingStateState } from "@oboku/shared"
import type { ReadingPosition } from "@prose-reader/core"
import type { DeepReadonly } from "rxdb"

export type BookPatch = (old: BookDocType, savedAt: string) => BookDocType

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
  function applyPatchesInOrder(old, savedAt) {
    return patches.reduce((book, patch) => patch(book, savedAt), old)
  }

export const createReadingPositionPatch = ({
  cfi,
  percentageEstimateOfBook,
  koreaderProgress,
  koreaderDocument,
}: SavedReadingPositionWithKoreaderForm): BookPatch =>
  function applyReadingPosition(old, savedAt) {
    const nextReadingState =
      old.readingStateCurrentState === ReadingStateState.Finished
        ? ReadingStateState.Finished
        : ReadingStateState.Reading
    const didReadingStateChange =
      old.readingStateCurrentBookmarkLocation !== cfi ||
      old.readingStateCurrentBookmarkProgressPercent !==
        percentageEstimateOfBook ||
      old.readingStateCurrentState !== nextReadingState
    const hadCfi = old.readingStateCurrentBookmarkLocation !== null
    const didBookmarkMove =
      hadCfi && old.readingStateCurrentBookmarkLocation !== cfi

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

/** The reading position patch dates the bookmark with the save's time, and only when it moves it. */
export const isBookmarkMovedAt = (
  book: DeepReadonly<BookDocType>,
  savedAt: string,
) => book.readingStateCurrentBookmarkLocationUpdatedAt === savedAt

export const createReachedProgressPatch = (
  reachedProgress: number,
): BookPatch =>
  function applyReachedProgress(old) {
    return { ...old, readingStateReachedProgressPercent: reachedProgress }
  }

export const markBookAsOpened: BookPatch = (old, savedAt) => ({
  ...old,
  readingStateUpdatedAt: savedAt,
})

/**
 * Finished is a reading state, not a progress (see `BookDocType`): the bookmark
 * and its progress stay the reading position's, which is short of 1 on the
 * last page, so a finished book can store 0.9.
 */
export const markBookAsFinished: BookPatch = (old, savedAt) => {
  if (old.readingStateCurrentState === ReadingStateState.Finished) return old

  return {
    ...old,
    readingStateCurrentState: ReadingStateState.Finished,
    readingStateUpdatedAt: savedAt,
  }
}
