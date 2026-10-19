import type {
  BookDocType,
  KoreaderSyncConnectionPushPositionData,
} from "@oboku/shared"
import { signal } from "reactjrx"

export type KoreaderPositionToPush = Omit<
  KoreaderSyncConnectionPushPositionData["body"],
  "deviceId"
>

type KoreaderPositionsByDocument = Record<string, KoreaderPositionToPush>

/**
 * The KOReader position each book last moved to while read on this device,
 * waiting to be pushed: by profile, then by KOReader document. It is kept in
 * memory only.
 */
export const koreaderPositionsToPushSignal = signal<
  Record<string, KoreaderPositionsByDocument>
>({ default: {} })

const withoutDocument = (
  positions: KoreaderPositionsByDocument,
  document: string,
) =>
  Object.fromEntries(
    Object.entries(positions).filter(function isOtherDocument([
      pendingDocument,
    ]) {
      return pendingDocument !== document
    }),
  )

/**
 * Records a book written by reading on this device. When its bookmark moved,
 * the bookmark's KOReader position replaces the one waiting for its document,
 * or drops it when KOReader cannot open the new place.
 */
export const recordBookmarkWriteForKoreader = ({
  profileId,
  old,
  book,
}: {
  profileId: string
  old: BookDocType
  book: BookDocType
}) => {
  const isBookmarkMove =
    book.readingStateCurrentBookmarkLocationUpdatedAt !==
    old.readingStateCurrentBookmarkLocationUpdatedAt
  const {
    readingStateCurrentBookmarkKoreaderDocument: document,
    readingStateCurrentBookmarkKoreaderProgress: progress,
    readingStateCurrentBookmarkProgressPercent: percentage,
  } = book

  if (!isBookmarkMove || !document) return

  koreaderPositionsToPushSignal.update(
    function withBookmarkPosition(positionsByProfile) {
      const otherPositions = withoutDocument(
        positionsByProfile[profileId] ?? {},
        document,
      )
      const positions = progress
        ? { ...otherPositions, [document]: { document, progress, percentage } }
        : otherPositions

      return { ...positionsByProfile, [profileId]: positions }
    },
  )
}

/** Forgets a pushed position, unless a newer one was recorded meanwhile. */
export const forgetPushedKoreaderPosition = ({
  profileId,
  position,
}: {
  profileId: string
  position: KoreaderPositionToPush
}) => {
  koreaderPositionsToPushSignal.update(
    function withoutPushedPosition(positionsByProfile) {
      const positions = positionsByProfile[profileId] ?? {}
      const isStillWaiting = positions[position.document] === position

      if (!isStillWaiting) return positionsByProfile

      return {
        ...positionsByProfile,
        [profileId]: withoutDocument(positions, position.document),
      }
    },
  )
}
