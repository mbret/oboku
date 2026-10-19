import { useEffect } from "react"
import {
  catchError,
  combineLatest,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  from,
  map,
  tap,
} from "rxjs"
import { getOrCreateInstallationId } from "../../common/browser"
import { navigatorOnLine$ } from "../../common/network/onLine"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import {
  forgetPushedKoreaderPosition,
  type KoreaderPositionToPush,
  koreaderPositionsToPushSignal,
} from "./koreaderPositionsToPush"
import { usePushKoreaderPosition } from "./usePushKoreaderPosition"

const KOREADER_SYNC_DEBOUNCE_MS = 3000

const NO_POSITIONS: Record<string, KoreaderPositionToPush> = {}

/**
 * Pushes the KOReader positions recorded by reading on this device, one at a
 * time, once they have stayed put for a few seconds and the device is online.
 * A position whose push fails stays recorded, and goes out with the next push
 * or when the network comes back.
 */
export const useSyncKoreaderPositions = () => {
  const activeProfileId = useActiveProfileId()
  const { mutateAsync: pushKoreaderPosition } = usePushKoreaderPosition({
    meta: { suppressGlobalErrorToast: true },
  })

  useEffect(
    function pushRecordedKoreaderPositions() {
      if (!activeProfileId) return

      const getRecordedPositions = () =>
        koreaderPositionsToPushSignal.getValue()[activeProfileId] ??
        NO_POSITIONS

      const settledPositions$ = koreaderPositionsToPushSignal.subject.pipe(
        map(function toProfilePositions(positionsByProfile) {
          return positionsByProfile[activeProfileId] ?? NO_POSITIONS
        }),
        distinctUntilChanged(),
        debounceTime(KOREADER_SYNC_DEBOUNCE_MS),
      )

      const subscription = combineLatest([settledPositions$, navigatorOnLine$])
        .pipe(
          filter(function isOnline([, onLine]) {
            return onLine
          }),
          concatMap(function pushRecordedPositions() {
            return from(Object.values(getRecordedPositions())).pipe(
              concatMap(function pushPosition(position) {
                return from(
                  pushKoreaderPosition({
                    ...position,
                    deviceId: getOrCreateInstallationId(),
                  }),
                ).pipe(
                  tap(function forgetOncePushed() {
                    forgetPushedKoreaderPosition({
                      profileId: activeProfileId,
                      position,
                    })
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
        .subscribe()

      return function stopPushingKoreaderPositions() {
        subscription.unsubscribe()
      }
    },
    [activeProfileId, pushKoreaderPosition],
  )
}
