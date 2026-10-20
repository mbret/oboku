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
  groupBy,
  map,
  mergeMap,
  switchMap,
} from "rxjs"
import { getOrCreateInstallationId } from "../../common/browser"
import { retryWhenOnLine, whenOnLine$ } from "../../common/network/onLine"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { bookmarkMoved$ } from "../../reader/events"
import { usePushKoreaderPosition } from "./usePushKoreaderPosition"

const KOREADER_SYNC_DEBOUNCE_MS = 3000

type KoreaderPosition = Omit<
  KoreaderSyncConnectionPushPositionData["body"],
  "deviceId"
>

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
 * A newer position of the same book replaces it, and a failed push is retried
 * while the device is online.
 */
export const useSyncKoreaderPositions = () => {
  const activeProfileId = useActiveProfileId()
  const { mutateAsync: pushKoreaderPosition } = usePushKoreaderPosition({
    meta: { suppressGlobalErrorToast: true },
  })

  useEffect(
    function pushMovedBookmarksToKoreader() {
      if (!activeProfileId) return

      const pushWhenOnLine = (position: KoreaderPosition) =>
        whenOnLine$.pipe(
          concatMap(function pushPosition() {
            return pushKoreaderPosition({
              ...position,
              deviceId: getOrCreateInstallationId(),
            })
          }),
          retryWhenOnLine,
        )

      const subscription = bookmarkMoved$
        .pipe(
          groupBy(toKoreaderDocument),
          mergeMap(function pushLatestPositionOfDocument(movedBooks$) {
            return movedBooks$.pipe(
              debounceTime(KOREADER_SYNC_DEBOUNCE_MS),
              map(toKoreaderPosition),
              switchMap(function pushSettledPosition(position) {
                return position ? pushWhenOnLine(position) : EMPTY
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
