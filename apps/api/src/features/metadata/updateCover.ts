import {
  type BookDocType,
  type BookMetadata,
  buildBookBucketCoverKey,
  getBookCoverKey,
} from "@oboku/shared"
import type { Archive } from "@prose-reader/archive-reader"
import { saveCoverFromArchiveToBucket } from "../../lib/books/covers/saveCoverFromArchiveToBucket.js"
import type { Context } from "./types.js"
import { saveCoverFromExternalLinkToBucket } from "../../lib/books/covers/saveCoverFromExternalLinkToBucket.js"
import { CoversService } from "../../covers/covers.service.js"
import { firstValueFrom } from "rxjs"
import { pickCoverMetadata } from "./pickCoverMetadata.js"

export type UpdateCoverResult = {
  bucketCoverKey?: string
}

export const updateCover = async ({
  metadataList,
  archive,
  book,
  ctx,
  coversService,
  force = false,
  catalogIdentityIsConfirmed,
}: {
  ctx: Context
  book: BookDocType
  metadataList: BookMetadata[]
  archive?: Archive
  coversService: CoversService
  /**
   * Hard refresh: regenerate the cover even when the bucket key
   * already matches the picked source and the blob exists.
   */
  force?: boolean
  /** Whether the catalog match is known to describe this exact book. */
  catalogIdentityIsConfirmed?: boolean
}): Promise<UpdateCoverResult> => {
  const coverObjectKey = getBookCoverKey(ctx.userNameHex, ctx.book._id)
  const metadataForCover = pickCoverMetadata(
    metadataList,
    book.metadataSourcePriority,
    { catalogIdentityIsConfirmed },
  )
  const expectedBucketCoverKey = metadataForCover?.coverLink
    ? buildBookBucketCoverKey({
        type: metadataForCover.type,
        value: metadataForCover.coverLink,
      })
    : undefined

  if (
    !force &&
    expectedBucketCoverKey !== undefined &&
    expectedBucketCoverKey === book.bucketCoverKey &&
    (await firstValueFrom(coversService.isCoverExist(coverObjectKey)))
  ) {
    console.log(
      `Skipping cover update for ${book._id} since the bucket cover already matches the picked source`,
    )

    return {}
  }

  if (
    metadataForCover?.type === "file" &&
    metadataForCover.coverLink &&
    archive
  ) {
    const saved = await saveCoverFromArchiveToBucket(
      coverObjectKey,
      archive,
      metadataForCover.coverLink,
      coversService,
    )

    return saved && expectedBucketCoverKey
      ? { bucketCoverKey: expectedBucketCoverKey }
      : {}
  }

  if (
    metadataForCover?.type === "googleBookApi" &&
    metadataForCover.coverLink
  ) {
    const saved = await saveCoverFromExternalLinkToBucket(
      coverObjectKey,
      metadataForCover.coverLink,
      coversService,
    )

    return saved && expectedBucketCoverKey
      ? { bucketCoverKey: expectedBucketCoverKey }
      : {}
  }

  return {}
}
