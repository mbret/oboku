import {
  type BookDocType,
  type BookMetadata,
  buildBookBucketCoverKey,
  getBookCoverKey,
} from "@oboku/shared"
import type { Extractor } from "node-unrar-js"
import { saveCoverFromRarArchiveToBucket } from "../../lib/books/covers/saveCoverFromRarArchiveToBucket"
import type { Context } from "./types"
import { saveCoverFromExternalLinkToBucket } from "../../lib/books/covers/saveCoverFromExternalLinkToBucket"
import { saveCoverFromZipArchiveToBucket } from "../../lib/books/covers/saveCoverFromZipArchiveToBucket"
import { CoversService } from "../../covers/covers.service"
import { firstValueFrom } from "rxjs"
import { pickCoverMetadata } from "./pickCoverMetadata"

export type UpdateCoverResult = {
  bucketCoverKey?: string
}

export const updateCover = async ({
  metadataList,
  archiveExtractor,
  book,
  ctx,
  tmpFilePath,
  coversService,
}: {
  ctx: Context
  book: BookDocType
  metadataList: BookMetadata[]
  archiveExtractor?: Extractor<Uint8Array> | undefined
  tmpFilePath?: string
  coversService: CoversService
}): Promise<UpdateCoverResult> => {
  const coverObjectKey = getBookCoverKey(ctx.userNameHex, ctx.book._id)
  const metadataForCover = pickCoverMetadata(
    metadataList,
    book.metadataSourcePriority,
  )
  const expectedBucketCoverKey = metadataForCover?.coverLink
    ? buildBookBucketCoverKey({
        type: metadataForCover.type,
        value: metadataForCover.coverLink,
      })
    : undefined

  if (
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
    archiveExtractor
  ) {
    const saved = await saveCoverFromRarArchiveToBucket(
      coverObjectKey,
      archiveExtractor,
      metadataForCover.coverLink,
      coversService,
    )

    return saved && expectedBucketCoverKey
      ? { bucketCoverKey: expectedBucketCoverKey }
      : {}
  }

  if (
    metadataForCover?.type === "file" &&
    metadataForCover.coverLink &&
    tmpFilePath
  ) {
    const saved = await saveCoverFromZipArchiveToBucket(
      coverObjectKey,
      tmpFilePath,
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
