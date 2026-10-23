import { useEffect } from "react"
import {
  catchError,
  concatMap,
  debounceTime,
  defer,
  distinctUntilChanged,
  EMPTY,
  filter,
  groupBy,
  map,
  mergeMap,
  of,
  switchMap,
} from "rxjs"
import { useIsAuthenticated } from "../../auth/useIsAuthenticated"
import { getBookById } from "../../books/dbHelpers"
import { whenOnLine$ } from "../../common/network/onLine"
import { fromAbortable } from "../../common/rxjs/fromAbortable"
import { retryOnFailure } from "../../common/network/retryOnFailure"
import { reportErrors } from "../../common/rxjs/operators"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { bookmarkMoved$ } from "../../reader/events"
import { isBookmarkMovedAt } from "../../reader/progress/bookProgressPatches"
import { useDatabase } from "../../rxdb/RxDbProvider"
import { usePushKoreaderPosition } from "./usePushKoreaderPosition"

const KOREADER_SYNC_DEBOUNCE_MS = 3000

/**
 * Pushes the KOReader position of each bookmark moved by reading on this
 * device, once it has stayed put for a few seconds, the device is online and
 * the account is signed in. Moves are recorded on this device, so a move oboku
 * closed before pushing is pushed at the next start. A move is pushed only
 * under the profile that made it, and not once the bookmark has moved on from
 * it. A failed push is retried once the device is online, waiting twice as
 * long each time, up to five minutes.
 */
export const useSyncKoreaderPositions = () => {
  const { db: database } = useDatabase()
  const activeProfileId = useActiveProfileId()
  const isAuthenticated = useIsAuthenticated()
  const { mutateAsync: pushKoreaderPosition } = usePushKoreaderPosition({
    meta: { suppressGlobalErrorToast: true },
  })

  useEffect(
    function recordBookmarkMoves() {
      if (!database || !activeProfileId) return

      const subscription = bookmarkMoved$
        .pipe(
          concatMap(function recordMove({ bookId, movedAt }) {
            return defer(function writeWaitingMove() {
              return database.koreaderpush.incrementalUpsert({
                _id: bookId,
                profileId: activeProfileId,
                movedAt,
              })
            }).pipe(
              reportErrors,
              catchError(function skipUnrecordedMove() {
                return EMPTY
              }),
            )
          }),
        )
        .subscribe()

      return function stopRecordingBookmarkMoves() {
        subscription.unsubscribe()
      }
    },
    [database, activeProfileId],
  )

  useEffect(
    function pushRecordedMoves() {
      if (!database || !isAuthenticated) return

      const pushMove = (bookId: string, movedAt: string) =>
        whenOnLine$.pipe(
          concatMap(function readBook() {
            return getBookById({ database, id: bookId })
          }),
          concatMap(function pushWhileBookmarkIsAtMove(book) {
            const isBookmarkAtMove = !!book && isBookmarkMovedAt(book, movedAt)

            return isBookmarkAtMove
              ? fromAbortable(function pushBookmark(signal) {
                  return pushKoreaderPosition({ book, signal })
                })
              : of(undefined)
          }),
          retryOnFailure,
          concatMap(function forgetHandledMove() {
            return database.koreaderpush
              .findOne(bookId)
              .incrementalModify(function forgetUnlessMovedAgain(waitingMove) {
                const isStillThisMove = waitingMove.movedAt === movedAt

                return isStillThisMove
                  ? { ...waitingMove, _deleted: true }
                  : waitingMove
              })
          }),
          reportErrors,
          catchError(function leaveMoveWaiting() {
            return EMPTY
          }),
        )

      const subscription = database.koreaderpush
        .find()
        .$.pipe(
          mergeMap(function emitEachWaitingMove(waitingMoves) {
            return waitingMoves
          }),
          filter(function isMadeUnderActiveProfile(waitingMove) {
            return waitingMove.profileId === activeProfileId
          }),
          groupBy(function byBook(waitingMove) {
            return waitingMove.primary
          }),
          mergeMap(function pushLatestMoveOfBook(waitingMovesOfBook$) {
            return waitingMovesOfBook$.pipe(
              map(function toMovedAt(waitingMove) {
                return waitingMove.movedAt
              }),
              distinctUntilChanged(),
              debounceTime(KOREADER_SYNC_DEBOUNCE_MS),
              switchMap(function pushSettledMove(movedAt) {
                return pushMove(waitingMovesOfBook$.key, movedAt)
              }),
            )
          }),
        )
        .subscribe()

      return function stopPushingRecordedMoves() {
        subscription.unsubscribe()
      }
    },
    [database, isAuthenticated, activeProfileId, pushKoreaderPosition],
  )
}
