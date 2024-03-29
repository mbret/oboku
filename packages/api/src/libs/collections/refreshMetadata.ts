import {
  CollectionDocType,
  CollectionMetadata,
  directives
} from "@oboku/shared"
import { fetchMetadata } from "./fetchMetadata"
import { atomicUpdate } from "@libs/couch/dbHelpers"
import nano from "nano"
import { Logger } from "@libs/logger"
import { pluginFacade } from "@libs/plugins/facade"

export const refreshMetadata = async (
  collection: CollectionDocType,
  {
    googleApiKey,
    db,
    credentials,
    soft,
    comicVineApiKey
  }: {
    googleApiKey?: string
    db: nano.DocumentScope<unknown>
    credentials?: any
    soft?: boolean
    comicVineApiKey: string
  }
) => {
  if (collection.type !== "series") {
    Logger.info(`Ignoring ${collection._id} because of type ${collection.type}`)

    return
  }

  try {
    await atomicUpdate(db, "obokucollection", collection._id, (old) => {
      const wasAlreadyInitialized =
        old.metadataUpdateStatus === "fetching" && old.lastMetadataStartedAt

      if (wasAlreadyInitialized) return old

      return {
        ...old,
        metadataUpdateStatus: "fetching" as const,
        lastMetadataStartedAt: new Date().toISOString()
      }
    })

    // we always get updated link data
    // we take a chance to update the collection from its resource
    const metadataLink =
      collection.linkResourceId && collection.linkType
        ? await pluginFacade.getMetadata({
            resourceId: collection.linkResourceId,
            linkType: collection.linkType,
            credentials
          })
        : undefined

    const linkModifiedAt = metadataLink?.modifiedAt
      ? new Date(metadataLink.modifiedAt)
      : undefined
    const collectionMetadataUpdatedAt = collection?.lastMetadataUpdatedAt
      ? new Date(collection?.lastMetadataUpdatedAt)
      : undefined

    const isCollectionAlreadyUpdatedFromLink =
      linkModifiedAt &&
      collectionMetadataUpdatedAt &&
      linkModifiedAt.getTime() < collectionMetadataUpdatedAt.getTime()

    /**
     * @important
     * In case of soft refresh, we only update if the link is updated
     * or if there is no link but the collection has not yet fetched metadata.
     * This soft mode is mostly used during sync.
     */

    if (soft && isCollectionAlreadyUpdatedFromLink) {
      Logger.info(`${collection._id} already has metadata, ignoring it!`)

      return {
        statusCode: 200,
        body: JSON.stringify({})
      }
    }

    if (soft && !metadataLink && collection.lastMetadataUpdatedAt) {
      Logger.info(
        `${collection._id} does not have link and is already refreshed, ignoring it!`
      )

      return {
        statusCode: 200,
        body: JSON.stringify({})
      }
    }

    const metadataUser = collection.metadata?.find(
      (item) => item.type === "user"
    )

    const directivesFromLink = directives.extractDirectivesFromName(
      metadataLink?.name ?? ""
    )

    const title = directives.removeDirectiveFromString(
      metadataLink?.name ?? metadataUser?.title ?? ""
    )
    const year = directivesFromLink.year ?? metadataUser?.startYear

    const updatedMetadataList = await fetchMetadata(
      { title, year: year ? String(year) : undefined },
      { withGoogle: true, googleApiKey, comicVineApiKey }
    )

    await atomicUpdate(db, "obokucollection", collection._id, (old) => {
      const persistentMetadataList =
        old.metadata?.filter((entry) =>
          (["user"] as CollectionMetadata["type"][]).includes(entry.type)
        ) ?? []

      const linkMetadata: CollectionMetadata = {
        type: "link",
        ...old.metadata?.find((item) => item.type === "link"),
        title: metadataLink?.name
      }

      return {
        ...old,
        lastMetadataUpdatedAt: new Date().toISOString(),
        metadataUpdateStatus: "idle",
        lastMetadataUpdateError: null,
        metadata: [
          ...persistentMetadataList,
          ...updatedMetadataList,
          linkMetadata
        ]
      } satisfies CollectionDocType
    })
  } catch (error) {
    await atomicUpdate(
      db,
      "obokucollection",
      collection._id,
      (old) =>
        ({
          ...old,
          metadataUpdateStatus: "idle",
          lastMetadataUpdateError: "unknown"
        }) satisfies CollectionDocType
    )

    throw error
  }
}
