import { isDeepStrictEqual } from "node:util"
import type { CollectionDocType, LinkData, LinkDocType } from "@oboku/shared"
import { atomicUpdate } from "../../couch/dbHelpers.js"
import type { Context } from "./types.js"

/**
 * Whether a sync item reports link data the stored copy does not hold yet.
 * Besides its identity, an item can report how to reach its resource, which
 * can change while the identity stays.
 */
const isLinkDataOutdated = (
  storedLinkData: object | undefined,
  syncedLinkData: object,
) =>
  !isDeepStrictEqual({ ...storedLinkData, ...syncedLinkData }, storedLinkData)

export const updateLinkData = async (
  { db, syncReport }: Pick<Context, "db" | "syncReport">,
  link: LinkDocType,
  syncedLinkData: LinkData,
) => {
  if (!isLinkDataOutdated(link.data, syncedLinkData)) return

  await atomicUpdate(
    db,
    "link",
    link._id,
    (old) =>
      // The sync matched the item to the link through its provider's
      // identity, so both hold that provider's link data. TypeScript sees the
      // link's provider and the item's as two unrelated unions.
      ({ ...old, data: { ...old.data, ...syncedLinkData } }) as LinkDocType,
  )

  syncReport.updateLink(link._id)
}

export const updateCollectionLinkData = async (
  { db, syncReport }: Pick<Context, "db" | "syncReport">,
  collection: CollectionDocType,
  syncedLinkData: LinkData,
) => {
  if (!isLinkDataOutdated(collection.linkData, syncedLinkData)) return

  await atomicUpdate(db, "obokucollection", collection._id, (old) => ({
    ...old,
    linkData: { ...old.linkData, ...syncedLinkData },
  }))

  syncReport.updateCollection(collection._id)
}
