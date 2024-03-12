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
    soft
  }: {
    googleApiKey?: string
    db: nano.DocumentScope<unknown>
    credentials?: any
    soft?: boolean
  }
) => {
  if (collection.type !== "series") {
    Logger.log(`Ignoring ${collection._id} because of type ${collection.type}`)

    return
  }

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

  const isCollectionOutdatedFromLink =
    linkModifiedAt &&
    collectionMetadataUpdatedAt &&
    linkModifiedAt.getTime() > collectionMetadataUpdatedAt.getTime()

  if (soft && !isCollectionOutdatedFromLink) {
    Logger.log(`${collection._id} already has metadata, ignoring it!`)

    return {
      statusCode: 200,
      body: JSON.stringify({})
    }
  }

  const metadataUser = collection.metadata?.find((item) => item.type === "user")

  const directivesFromLink = directives.extractDirectivesFromName(
    metadataLink?.name ?? ""
  )

  const title = directives.removeDirectiveFromString(
    metadataLink?.name ?? metadataUser?.title ?? ""
  )
  const year = directivesFromLink.year ?? metadataUser?.startYear

  const updatedMetadataList = await fetchMetadata(
    { title, year: year ? String(year) : undefined },
    { withGoogle: true, googleApiKey }
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
      metadata: [
        ...persistentMetadataList,
        ...updatedMetadataList,
        linkMetadata
      ]
    }
  })
}
