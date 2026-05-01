import {
  type BookDocType,
  type BookMetadata,
  getBookCoverKey,
  getOrderedBookMetadataSources,
} from "@oboku/shared"
import type { Extractor } from "node-unrar-js"
import { saveCoverFromRarArchiveToBucket } from "../../lib/books/covers/saveCoverFromRarArchiveToBucket"
import type { Context } from "./types"
import { saveCoverFromExternalLinkToBucket } from "../../lib/books/covers/saveCoverFromExternalLinkToBucket"
import { saveCoverFromZipArchiveToBucket } from "../../lib/books/covers/saveCoverFromZipArchiveToBucket"
import { CoversService } from "../../covers/covers.service"
import { firstValueFrom } from "rxjs"

/**
 * Picks the metadata entry that should provide the cover, honoring the
 * user-defined source priority persisted on the book
 * (`metadataSourcePriority`). Sources are walked highest → lowest
 * priority; the first entry that actually carries a `coverLink` wins.
 *
 * Mirrors the merge precedence used on the web in
 * {@link getMetadataFromBook} so the cached cover image stays consistent
 * with the metadata fields surfaced in the UI.
 */
const pickCoverMetadata = (
  metadataList: ReadonlyArray<BookMetadata> | undefined,
  priority: BookDocType["metadataSourcePriority"],
): BookMetadata | undefined => {
  if (!metadataList?.length) return undefined

  const orderedSources = getOrderedBookMetadataSources(priority)

  for (const source of orderedSources) {
    const match = metadataList.find(
      (metadata) => metadata.type === source && metadata.coverLink,
    )

    if (match) return match
  }

  return undefined
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
}) => {
  const currentMetadaForCover = pickCoverMetadata(
    book.metadata,
    book.metadataSourcePriority,
  )
  const coverObjectKey = getBookCoverKey(ctx.userNameHex, ctx.book._id)
  const metadataForCover = pickCoverMetadata(
    metadataList,
    book.metadataSourcePriority,
  )

  if (
    metadataForCover?.type === currentMetadaForCover?.type &&
    metadataForCover?.coverLink &&
    metadataForCover.coverLink === currentMetadaForCover?.coverLink &&
    (await firstValueFrom(coversService.isCoverExist(coverObjectKey)))
  ) {
    console.log(
      `Skipping cover update for ${book._id} since the current and new cover link are equals`,
    )

    return
  }

  if (
    metadataForCover?.type === "file" &&
    metadataForCover.coverLink &&
    archiveExtractor
  ) {
    await saveCoverFromRarArchiveToBucket(
      coverObjectKey,
      archiveExtractor,
      metadataForCover.coverLink,
      coversService,
    )

    return
  }

  if (
    metadataForCover?.type === "file" &&
    metadataForCover.coverLink &&
    tmpFilePath
  ) {
    await saveCoverFromZipArchiveToBucket(
      coverObjectKey,
      tmpFilePath,
      metadataForCover.coverLink,
      coversService,
    )

    return
  }

  if (
    metadataForCover?.type === "googleBookApi" &&
    metadataForCover.coverLink
  ) {
    const objectKey = getBookCoverKey(ctx.userNameHex, ctx.book._id)

    await saveCoverFromExternalLinkToBucket(
      objectKey,
      metadataForCover.coverLink,
      coversService,
    )

    return
  }
}
