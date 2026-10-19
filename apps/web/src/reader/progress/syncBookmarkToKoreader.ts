import type { KoreaderSyncConnectionPushPositionData } from "@oboku/shared"
import {
  catchError,
  concatMap,
  debounceTime,
  EMPTY,
  filter,
  first,
  from,
  map,
  type OperatorFunction,
  switchMap,
} from "rxjs"
import { getOrCreateInstallationId } from "../../common/browser"
import { navigatorOnLine$ } from "../../common/network/onLine"
import { isKoreaderSyncConnectionUnusableError } from "../../koreader/syncConnection/errors"
import type { BookChange } from "./bookProgressPatches"

const KOREADER_SYNC_DEBOUNCE_MS = 3000

type KoreaderPosition = KoreaderSyncConnectionPushPositionData["body"]

const isBookmarkMove = ({ old, book }: BookChange) =>
  book.readingStateCurrentBookmarkLocationUpdatedAt !==
  old.readingStateCurrentBookmarkLocationUpdatedAt

const toKoreaderPosition = ({ book }: BookChange) => {
  const {
    readingStateCurrentBookmarkKoreaderDocument: document,
    readingStateCurrentBookmarkKoreaderProgress: progress,
    readingStateCurrentBookmarkProgressPercent: percentage,
  } = book
  const hasKoreaderForm = !!document && !!progress

  if (!hasKoreaderForm) return null

  return { document, progress, percentage }
}

/**
 * Pushes the bookmark to the connected KOReader sync server each time a
 * written change moves it, once it has stayed put for a few seconds.
 *
 * The debounce flushes when the changes complete, so the last move is pushed
 * once the book closes, after its last write. It comes before dropping the
 * places KOReader cannot open, so such a move cancels the push pending before
 * it. Offline, the push waits for the network, keeping only the latest
 * position. A push is skipped while the account is known to have no
 * connection, which a push refused for that reason records.
 */
export const syncBookmarkToKoreader = ({
  isKoreaderSyncDisconnected,
  pushKoreaderPosition,
}: {
  isKoreaderSyncDisconnected: () => boolean
  pushKoreaderPosition: (position: KoreaderPosition) => Promise<unknown>
}): OperatorFunction<BookChange | undefined, unknown> =>
  function pushBookmarkMoves(bookChange$) {
    return bookChange$.pipe(
      filter(function isChangeWritten(change) {
        return change !== undefined
      }),
      filter(isBookmarkMove),
      map(toKoreaderPosition),
      debounceTime(KOREADER_SYNC_DEBOUNCE_MS),
      filter(function isKoreaderPosition(position) {
        return position !== null
      }),
      switchMap(function waitUntilOnline(position) {
        return navigatorOnLine$.pipe(
          first(function isOnline(onLine) {
            return onLine
          }),
          map(function toOnlinePosition() {
            return position
          }),
        )
      }),
      concatMap(function pushToKoreader(position) {
        if (isKoreaderSyncDisconnected()) return EMPTY

        return from(
          pushKoreaderPosition({
            ...position,
            deviceId: getOrCreateInstallationId(),
          }),
        ).pipe(
          catchError(function logUnexpectedKoreaderSyncError(error) {
            if (!isKoreaderSyncConnectionUnusableError(error)) {
              console.error(error)
            }

            return EMPTY
          }),
        )
      }),
    )
  }
