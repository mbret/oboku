import type {
  BookDocType,
  KoreaderSyncConnectionPushPositionData,
} from "@oboku/shared"
import { useEffect } from "react"
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  from,
  merge,
  tap,
} from "rxjs"
import { getOrCreateInstallationId } from "../../common/browser"
import { navigatorOnLine$ } from "../../common/network/onLine"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { bookmarkMoved$ } from "../../reader/events"
import { usePushKoreaderPosition } from "./usePushKoreaderPosition"

const KOREADER_SYNC_DEBOUNCE_MS = 3000

type KoreaderPosition = Omit<
  KoreaderSyncConnectionPushPositionData["body"],
  "deviceId"
>

type KoreaderPositionsByDocument = Record<string, KoreaderPosition>

const withoutDocument = (
  positions: KoreaderPositionsByDocument,
  document: string,
) =>
  Object.fromEntries(
    Object.entries(positions).filter(function isOtherDocument([
      waitingDocument,
    ]) {
      return waitingDocument !== document
    }),
  )

/**
 * The bookmark's KOReader position replaces the one waiting for its document,
 * or drops it when KOReader cannot open the bookmark's place.
 */
const withMovedBookmark = (
  positions: KoreaderPositionsByDocument,
  book: BookDocType,
) => {
  const {
    readingStateCurrentBookmarkKoreaderDocument: document,
    readingStateCurrentBookmarkKoreaderProgress: progress,
    readingStateCurrentBookmarkProgressPercent: percentage,
  } = book

  if (!document) return positions

  const otherPositions = withoutDocument(positions, document)

  return progress
    ? { ...otherPositions, [document]: { document, progress, percentage } }
    : otherPositions
}

const withoutPushedPosition = (
  positions: KoreaderPositionsByDocument,
  position: KoreaderPosition,
) => {
  const isStillWaiting = positions[position.document] === position

  return isStillWaiting
    ? withoutDocument(positions, position.document)
    : positions
}

/**
 * Pushes the KOReader position of each bookmark moved by reading on this
 * device, one at a time, once it has stayed put for a few seconds and the
 * device is online. A position whose push fails keeps waiting, and goes out
 * with the next push or when the network comes back.
 */
export const useSyncKoreaderPositions = () => {
  const activeProfileId = useActiveProfileId()
  const { mutateAsync: pushKoreaderPosition } = usePushKoreaderPosition({
    meta: { suppressGlobalErrorToast: true },
  })

  useEffect(
    function pushMovedBookmarksToKoreader() {
      if (!activeProfileId) return

      const waitingPositions = new BehaviorSubject<KoreaderPositionsByDocument>(
        {},
      )

      const waitForMovedBookmarks$ = bookmarkMoved$.pipe(
        tap(function waitForPush(book) {
          waitingPositions.next(
            withMovedBookmark(waitingPositions.getValue(), book),
          )
        }),
      )

      const settledPositions$ = waitingPositions.pipe(
        distinctUntilChanged(),
        debounceTime(KOREADER_SYNC_DEBOUNCE_MS),
      )

      const pushWaitingPositions$ = combineLatest([
        settledPositions$,
        navigatorOnLine$,
      ]).pipe(
        filter(function isOnline([, onLine]) {
          return onLine
        }),
        concatMap(function pushWaitingPositions() {
          return from(Object.values(waitingPositions.getValue())).pipe(
            concatMap(function pushPosition(position) {
              return from(
                pushKoreaderPosition({
                  ...position,
                  deviceId: getOrCreateInstallationId(),
                }),
              ).pipe(
                tap(function forgetOncePushed() {
                  waitingPositions.next(
                    withoutPushedPosition(
                      waitingPositions.getValue(),
                      position,
                    ),
                  )
                }),
                catchError(function keepForNextPush(error) {
                  console.error(error)

                  return EMPTY
                }),
              )
            }),
          )
        }),
      )

      const subscription = merge(
        waitForMovedBookmarks$,
        pushWaitingPositions$,
      ).subscribe()

      return function stopPushingKoreaderPositions() {
        subscription.unsubscribe()
      }
    },
    [activeProfileId, pushKoreaderPosition],
  )
}
