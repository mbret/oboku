import type {
  BookDocType,
  KoreaderSyncConnectionPushPositionData,
} from "@oboku/shared"
import { useEffect } from "react"
import type { DeepReadonly } from "rxdb"
import {
  concatMap,
  debounceTime,
  EMPTY,
  first,
  groupBy,
  map,
  mergeMap,
  retry,
  skip,
  switchMap,
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

const isOnline = (onLine: boolean) => onLine

const networkComesBack$ = navigatorOnLine$.pipe(skip(1), first(isOnline))

const toKoreaderDocument = ({
  readingStateCurrentBookmarkKoreaderDocument,
}: DeepReadonly<BookDocType>) => readingStateCurrentBookmarkKoreaderDocument

/** `undefined` when KOReader cannot open the bookmark's place. */
const toKoreaderPosition = ({
  readingStateCurrentBookmarkKoreaderDocument: document,
  readingStateCurrentBookmarkKoreaderProgress: progress,
  readingStateCurrentBookmarkProgressPercent: percentage,
}: DeepReadonly<BookDocType>): KoreaderPosition | undefined => {
  if (!document || !progress) return undefined

  return { document, progress, percentage }
}

/**
 * Pushes the KOReader position of each bookmark moved by reading on this
 * device, once it has stayed put for a few seconds and the device is online.
 * A newer position of the same book replaces it, and a position whose push
 * fails goes out again when the network comes back.
 */
export const useSyncKoreaderPositions = () => {
  const activeProfileId = useActiveProfileId()
  const { mutateAsync: pushKoreaderPosition } = usePushKoreaderPosition({
    meta: { suppressGlobalErrorToast: true },
  })

  useEffect(
    function pushMovedBookmarksToKoreader() {
      if (!activeProfileId) return

      const pushWhenOnline = (position: KoreaderPosition) =>
        navigatorOnLine$.pipe(
          first(isOnline),
          concatMap(function pushPosition() {
            return pushKoreaderPosition({
              ...position,
              deviceId: getOrCreateInstallationId(),
            })
          }),
          tap({
            error: function logFailedPush(error) {
              console.error(error)
            },
          }),
          retry({
            delay: function waitForNetworkToComeBack() {
              return networkComesBack$
            },
          }),
        )

      const subscription = bookmarkMoved$
        .pipe(
          groupBy(toKoreaderDocument),
          mergeMap(function pushLatestPositionOfDocument(movedBooks$) {
            return movedBooks$.pipe(
              debounceTime(KOREADER_SYNC_DEBOUNCE_MS),
              map(toKoreaderPosition),
              switchMap(function pushSettledPosition(position) {
                return position ? pushWhenOnline(position) : EMPTY
              }),
            )
          }),
        )
        .subscribe()

      return function stopPushingKoreaderPositions() {
        subscription.unsubscribe()
      }
    },
    [activeProfileId, pushKoreaderPosition],
  )
}
