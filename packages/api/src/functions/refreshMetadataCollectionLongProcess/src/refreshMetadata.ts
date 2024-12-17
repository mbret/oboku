import {
  CollectionDocType,
  CollectionMetadata,
  directives
} from "@oboku/shared"
import { fetchMetadata } from "./fetchMetadata"
import { atomicUpdate, findOne } from "@libs/couch/dbHelpers"
import nano from "nano"
import { Logger } from "@libs/logger"
import { pluginFacade } from "@libs/plugins/facade"
import { computeMetadata } from "@libs/collections/computeMetadata"
import { saveOrUpdateCover } from "./saveOrUpdateCover"

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
    const linkMetadataInfo =
      collection.linkResourceId && collection.linkType
        ? await pluginFacade.getMetadata({
            link: {
              resourceId: collection.linkResourceId,
              type: collection.linkType,
              data: null
            },
            credentials
          })
        : undefined

    const linkModifiedAt = linkMetadataInfo?.modifiedAt
      ? new Date(linkMetadataInfo.modifiedAt)
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

    if (soft && !linkMetadataInfo && collection.lastMetadataUpdatedAt) {
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
    const { title: userTitle, startYear: userStartYear } = computeMetadata([
      metadataUser
    ])

    const directivesFromLink = directives.extractDirectivesFromName(
      linkMetadataInfo?.name ?? ""
    )

    const title = directives.removeDirectiveFromString(
      directivesFromLink.metadataTitle ??
        linkMetadataInfo?.name ??
        userTitle ??
        ""
    )

    const year = directivesFromLink.year ?? userStartYear

    const externalMetadatas = await fetchMetadata(
      { title, year: year ? String(year) : undefined },
      { withGoogle: true, googleApiKey, comicVineApiKey }
    )

    const linkMetadata: CollectionMetadata = {
      type: "link",
      ...collection.metadata?.find((item) => item.type === "link"),
      title: linkMetadataInfo?.name
    }

    // try to get latest collection to stay as fresh as possible
    const currentCollection = await findOne(db, "obokucollection", {
      selector: { _id: collection._id }
    })

    if (!currentCollection) throw new Error("Unable to find collection")

    const userMetadata =
      currentCollection.metadata?.filter((entry) => entry.type === "user") ?? []
    const metadata = [...userMetadata, ...externalMetadatas, linkMetadata]

    // cannot be done in // since metadata status will trigger cover refresh
    await saveOrUpdateCover(currentCollection, {
      _id: currentCollection._id,
      metadata
    })

    await atomicUpdate(
      db,
      "obokucollection",
      collection._id,
      (old) =>
        ({
          ...old,
          lastMetadataUpdatedAt: new Date().toISOString(),
          metadataUpdateStatus: "idle",
          lastMetadataUpdateError: null,
          metadata
        }) satisfies CollectionDocType
    )
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
