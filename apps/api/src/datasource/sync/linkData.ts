import { isDeepStrictEqual } from "node:util"
import type { LinkData, LinkDocType } from "@oboku/shared"

/**
 * Whether a sync item reports link data the stored copy does not hold yet.
 * Besides its identity, an item reports how to reach its resource, like the
 * acquisition URL of an OPDS entry, which can change while the identity stays.
 */
export const isLinkDataOutdated = (
  storedLinkData: object | undefined,
  syncedLinkData: object,
) =>
  !isDeepStrictEqual({ ...storedLinkData, ...syncedLinkData }, storedLinkData)

/** `link` holding the link data a sync item matched to it reports. */
export const withSyncedLinkData = (
  link: LinkDocType,
  syncedLinkData: LinkData,
): LinkDocType =>
  // The sync matched the item to the link through its provider's identity, so
  // both hold that provider's link data. TypeScript sees the link's provider
  // and the item's as two unrelated unions.
  ({ ...link, data: { ...link.data, ...syncedLinkData } }) as LinkDocType
