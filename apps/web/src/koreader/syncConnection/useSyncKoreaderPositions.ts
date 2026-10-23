import type { BookDocType } from "@oboku/shared"
import { useEffect } from "react"
import { retryBackoff } from "reactjrx"
import type { DeepReadonly } from "rxdb"
import {
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  from,
  groupBy,
  map,
  mergeMap,
  Observable,
  of,
  switchMap,
} from "rxjs"
import { useIsAuthenticated } from "../../auth/useIsAuthenticated"
import { whenOnLine$ } from "../../common/network/onLine"
import { reportErrors } from "../../common/rxjs/operators"
import { bookmarkMoved$ } from "../../reader/events"
import { isBookmarkMovedAt } from "../../reader/progress/bookProgressPatches"
import type { KoreaderPushDocType } from "../../rxdb/collections/koreaderPush"
import { useDatabase } from "../../rxdb/RxDbProvider"
import { usePushKoreaderPosition } from "./usePushKoreaderPosition"

const KOREADER_SYNC_DEBOUNCE_MS = 3000
const PUSH_RETRY_DELAY_MS = 1000
const PUSH_RETRY_MAX_DELAY_MS = 5 * 60 * 1000

const toWaitingMovedAt = ({
  movedAt,
  handledMovedAt,
}: DeepReadonly<KoreaderPushDocType>) =>
  movedAt === handledMovedAt ? undefined : movedAt

/**
 * Pushes the KOReader position of each bookmark moved by reading on this
 * device, once it has stayed put for a few seconds, the device is online and
 * the account is signed in. Moves are recorded in the account's database, so
 * a move oboku closed before pushing is pushed at the next start. A move is
 * not pushed once the bookmark has moved on, or when the server holds it or a
 * newer position. A failed push is retried once the device is online, waiting
 * twice as long each time, up to five minutes.
 */
export const useSyncKoreaderPositions = () => {
  const { db: database } = useDatabase()
  const isAuthenticated = useIsAuthenticated()
  const { mutateAsync: pushKoreaderPosition } = usePushKoreaderPosition({
    meta: { suppressGlobalErrorToast: true },
  })

  useEffect(
    function recordBookmarkMoves() {
      if (!database) return

      const subscription = bookmarkMoved$
        .pipe(
          concatMap(function recordMove({ bookId, movedAt }) {
            return from(
              database.koreaderpush.incrementalUpsert({ _id: bookId, movedAt }),
            ).pipe(
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
    [database],
  )

  useEffect(
    function pushRecordedMoves() {
      if (!database || !isAuthenticated) return

      const pushUntilUnsubscribed = (book: DeepReadonly<BookDocType>) =>
        new Observable<void>(function pushAbortably(subscriber) {
          const abortController = new AbortController()

          pushKoreaderPosition({ book, signal: abortController.signal }).then(
            function completePush() {
              subscriber.next()
              subscriber.complete()
            },
            function failPush(error) {
              subscriber.error(error)
            },
          )

          return function abortPush() {
            abortController.abort()
          }
        })

      const pushMove = (bookId: string, movedAt: string) =>
        whenOnLine$.pipe(
          concatMap(function readBook() {
            return from(database.book.findOne(bookId).exec())
          }),
          map(function toBookData(book) {
            return book?.toJSON()
          }),
          concatMap(function pushWhileBookmarkIsAtMove(book) {
            const isBookmarkAtMove = !!book && isBookmarkMovedAt(book, movedAt)

            return isBookmarkAtMove
              ? pushUntilUnsubscribed(book)
              : of(undefined)
          }),
          retryBackoff({
            initialInterval: PUSH_RETRY_DELAY_MS,
            maxInterval: PUSH_RETRY_MAX_DELAY_MS,
          }),
          concatMap(function markMoveHandled() {
            return from(
              database.koreaderpush
                .findOne(bookId)
                .incrementalPatch({ handledMovedAt: movedAt }),
            )
          }),
          reportErrors,
          catchError(function leaveMoveWaiting() {
            return EMPTY
          }),
        )

      const subscription = database.koreaderpush
        .find()
        .$.pipe(
          mergeMap(function emitEachBook(koreaderPushes) {
            return koreaderPushes
          }),
          groupBy(function byBook(koreaderPush) {
            return koreaderPush.primary
          }),
          mergeMap(function pushLatestMoveOfBook(koreaderPushesOfBook$) {
            return koreaderPushesOfBook$.pipe(
              map(function toWaitingMove(koreaderPush) {
                return toWaitingMovedAt(koreaderPush.toJSON())
              }),
              distinctUntilChanged(),
              debounceTime(KOREADER_SYNC_DEBOUNCE_MS),
              switchMap(function pushSettledMove(movedAt) {
                return movedAt
                  ? pushMove(koreaderPushesOfBook$.key, movedAt)
                  : EMPTY
              }),
            )
          }),
        )
        .subscribe()

      return function stopPushingRecordedMoves() {
        subscription.unsubscribe()
      }
    },
    [database, isAuthenticated, pushKoreaderPosition],
  )
}
