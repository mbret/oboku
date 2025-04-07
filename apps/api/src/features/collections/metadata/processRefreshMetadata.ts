import {
  type CollectionDocType,
  type CollectionMetadata,
  directives,
} from "@oboku/shared"
import { fetchMetadata } from "./fetchMetadata"
import type nano from "nano"
import { saveOrUpdateCover } from "./saveOrUpdateCover"
import { from, lastValueFrom, of, switchMap } from "rxjs"
import { markCollectionAsFetching } from "./collections"
import { pluginFacade } from "src/lib/plugins/facade"
import { Logger } from "@nestjs/common"
import { computeMetadata } from "src/lib/collections/computeMetadata"
import { findOne } from "src/lib/couch/findOne"
import { atomicUpdate } from "src/lib/couch/dbHelpers"
import { CoversService } from "src/covers/covers.service"

export const processrefreshMetadata = async (
  collection: CollectionDocType,
  {
    googleApiKey,
    db,
    credentials,
    soft,
    comicVineApiKey,
  }: {
    googleApiKey?: string
    db: nano.DocumentScope<unknown>
    credentials?: Record<string, unknown>
    soft?: boolean
    comicVineApiKey?: string
  },
  coversService: CoversService,
) => {
  const { isCollectionAlreadyUpdatedFromLink, linkMetadataInfo } =
    await lastValueFrom(
      markCollectionAsFetching({ db, collectionId: collection._id }).pipe(
        // we always get updated link data
        // we take a chance to update the collection from its resource
        switchMap(() =>
          collection.linkResourceId && collection.linkType
            ? from(
                pluginFacade.getMetadata({
                  link: {
                    resourceId: collection.linkResourceId,
                    type: collection.linkType,
                    data: null,
                  },
                  credentials,
                }),
              )
            : of(undefined),
        ),
        switchMap((linkMetadataInfo) => {
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

          return of({ linkMetadataInfo, isCollectionAlreadyUpdatedFromLink })
        }),
      ),
    )

  /**
   * @important
   * In case of soft refresh, we only update if the link is updated
   * or if there is no link but the collection has not yet fetched metadata.
   * This soft mode is mostly used during sync.
   */
  if (soft && isCollectionAlreadyUpdatedFromLink) {
    Logger.log(`${collection._id} already has metadata, ignoring it!`)

    return
  }

  if (soft && !linkMetadataInfo && collection.lastMetadataUpdatedAt) {
    Logger.log(
      `${collection._id} does not have link and is already refreshed, ignoring it!`,
    )

    return
  }

  const metadataUser = collection.metadata?.find((item) => item.type === "user")
  const { title: userTitle, startYear: userStartYear } = computeMetadata([
    metadataUser,
  ])

  const directivesFromLink = directives.extractDirectivesFromName(
    linkMetadataInfo?.name ?? "",
  )

  // for nwo we can only make a series through directives
  const collectionType = directivesFromLink.series ? "series" : "shelve"

  const title = directives.removeDirectiveFromString(
    directivesFromLink.metadataTitle ??
      linkMetadataInfo?.name ??
      userTitle ??
      "",
  )

  const year = directivesFromLink.year ?? userStartYear

  const externalMetadatas =
    collectionType === "series"
      ? await fetchMetadata(
          { title, year: year ? String(year) : undefined },
          { withGoogle: true, googleApiKey, comicVineApiKey },
        )
      : []

  const linkMetadata: CollectionMetadata = {
    type: "link",
    ...collection.metadata?.find((item) => item.type === "link"),
    title: linkMetadataInfo?.name,
  }

  // try to get latest collection to stay as fresh as possible
  const currentCollection = await findOne(
    "obokucollection",
    {
      selector: { _id: collection._id },
    },
    { db },
  )

  if (!currentCollection) throw new Error("Unable to find collection")

  const userMetadata =
    currentCollection.metadata?.filter((entry) => entry.type === "user") ?? []
  const metadata = [...userMetadata, ...externalMetadatas, linkMetadata]

  // cannot be done in // since metadata status will trigger cover refresh
  await saveOrUpdateCover(
    currentCollection,
    {
      _id: currentCollection._id,
      metadata,
    },
    coversService,
  )

  await atomicUpdate(
    db,
    "obokucollection",
    collection._id,
    (old) =>
      ({
        ...old,
        type: collectionType,
        lastMetadataUpdatedAt: new Date().toISOString(),
        metadataUpdateStatus: "idle",
        lastMetadataUpdateError: null,
        metadata,
      }) satisfies CollectionDocType,
  )
}
