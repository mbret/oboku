import { isShallowEqual, type ReadingPosition } from "@prose-reader/core"
import {
  bufferTime,
  distinctUntilChanged,
  filter,
  map,
  merge,
  type Observable,
  of,
  takeUntil,
} from "rxjs"
import type { ReaderInstance } from "../states"
import {
  composePatches,
  createReachedProgressPatch,
  createReadingPositionPatch,
  hasPatches,
  markBookAsFinished,
  markBookAsOpened,
  normalizeProgress,
  toSavedReadingPosition,
} from "./bookProgressPatches"

const SYNC_BOOK_PROGRESS_INTERVAL_MS = 1000

type PaginationProgress = {
  isSettled: boolean
  percentageEstimateOfBook: number
  end: { spineItemIndex: number | undefined }
}

const isSettled = ({ isSettled }: PaginationProgress) => isSettled

const isAtEndOfBook = ({ percentageEstimateOfBook }: PaginationProgress) =>
  percentageEstimateOfBook === 1

const toReachedProgress = ({ percentageEstimateOfBook }: PaginationProgress) =>
  normalizeProgress(percentageEstimateOfBook)

const toPositionProgress = ({ percentageEstimateOfBook }: ReadingPosition) =>
  normalizeProgress(percentageEstimateOfBook)

const isFoundReadingPosition = ({ status }: ReadingPosition) =>
  status === "success"

/**
 * The patches that save what the reader reports to its book, until `stop$`
 * emits: the opening, the bookmark and the reached progress, batched every
 * second, and the book finished as soon as its end shows.
 */
export const observeBookProgressPatches = ({
  reader,
  koreaderDocument,
  stop$,
}: {
  reader: ReaderInstance
  koreaderDocument: string
  stop$: Observable<void>
}) => {
  const foundReadingPosition$ = reader.navigation.readingPosition$.pipe(
    filter(isFoundReadingPosition),
  )

  const readingPositionPatch$ = foundReadingPosition$.pipe(
    map(toSavedReadingPosition),
    distinctUntilChanged(isShallowEqual),
    map(function withKoreaderForm(position) {
      return {
        ...position,
        koreaderProgress: reader.koreader.cfiToProgress(position.cfi) ?? null,
        koreaderDocument,
      }
    }),
    map(createReadingPositionPatch),
  )

  const isSettledOnLoadedPage = (pagination: PaginationProgress) => {
    const lastVisibleSpineItem = reader.spineItemsManager.get(
      pagination.end.spineItemIndex,
    )
    const didLastVisiblePageFailToLoad =
      lastVisibleSpineItem?.value.loadStatus === "error"

    return isSettled(pagination) && !didLastVisiblePageFailToLoad
  }

  const progressUntilPaginationSettles$ = foundReadingPosition$.pipe(
    map(toPositionProgress),
  )

  const progressOncePaginationSettles$ = reader.pagination.state$.pipe(
    filter(isSettledOnLoadedPage),
    map(toReachedProgress),
  )

  const reachedProgressPatch$ = merge(
    progressUntilPaginationSettles$,
    progressOncePaginationSettles$,
  ).pipe(distinctUntilChanged(), map(createReachedProgressPatch))

  // bufferTime is preferred over auditTime because it flushes its
  // pending buffer on source completion, guaranteeing the latest
  // progress is written when the hook unmounts.
  const throttledProgressPatch$ = merge(
    of(markBookAsOpened),
    readingPositionPatch$,
    reachedProgressPatch$,
  ).pipe(
    takeUntil(stop$),
    bufferTime(SYNC_BOOK_PROGRESS_INTERVAL_MS),
    filter(hasPatches),
    map(composePatches),
  )

  const endOfBookPatch$ = reader.pagination.state$.pipe(
    filter(isSettledOnLoadedPage),
    filter(isAtEndOfBook),
    map(function toFinishedPatch() {
      return markBookAsFinished
    }),
    takeUntil(stop$),
  )

  return merge(throttledProgressPatch$, endOfBookPatch$)
}
