import {
  COLLECTION_METADATA_LOCK_MN,
  type CollectionDocType,
} from "@oboku/shared"
import { useEffect, useState } from "react"
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
  const [now, setNow] = useState(() => Date.now())

  useEffect(
    function rerenderWhenLockExpires() {
      if (lockExpiresAt === undefined) return

      const timeout = setTimeout(function onLockExpired() {
        setNow(Date.now())
      }, lockExpiresAt - Date.now())

      return function clearLockExpiryTimeout() {
        clearTimeout(timeout)
      }
    },
    [lockExpiresAt],
  )

  return lockExpiresAt !== undefined && now < lockExpiresAt
}
