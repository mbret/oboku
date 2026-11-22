import {
  COLLECTION_METADATA_LOCK_MN,
  type CollectionDocType,
} from "@oboku/shared"
import { useObserve } from "reactjrx"
import { concat, defer, map, of, timer } from "rxjs"
import { addSeconds } from "../common/date/addSeconds"

const SECONDS_IN_MINUTE = 60

/**
 * Whether the collection's metadata refresh lock is active. Re-renders when the
 * lock expires, so a refresh stuck in `fetching` unlocks after
 * `COLLECTION_METADATA_LOCK_MN` minutes.
 */
export const useIsCollectionMetadataRefreshing = (
  collection:
    | Pick<CollectionDocType, "metadataUpdateStatus" | "lastMetadataStartedAt">
    | null
    | undefined,
) => {
  const lockStartedAt =
    collection?.metadataUpdateStatus === "fetching"
      ? collection.lastMetadataStartedAt
      : undefined
  const lockExpiresAt = lockStartedAt
    ? addSeconds(
        lockStartedAt,
        COLLECTION_METADATA_LOCK_MN * SECONDS_IN_MINUTE,
      ).getTime()
    : undefined
  const hasLock = lockExpiresAt !== undefined

  const { data: isRefreshing } = useObserve(
    function observeIsLockActive() {
      return defer(function emitUntilLockExpires() {
        const isLockActive = hasLock && Date.now() < lockExpiresAt

        if (!isLockActive) return of(false)

        const lockExpired$ = timer(new Date(lockExpiresAt)).pipe(
          map(() => false),
        )

        return concat(of(true), lockExpired$)
      })
    },
    [lockExpiresAt],
  )

  // `useObserve` has no value until its effect subscribes. Treating a present
  // lock as active until then keeps the refresh action disabled meanwhile.
  return isRefreshing ?? hasLock
}
