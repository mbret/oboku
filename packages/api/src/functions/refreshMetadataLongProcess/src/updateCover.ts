import { saveCoverFromZipArchiveToBucket } from "@libs/books/covers/saveCoverFromZipArchiveToBucket"
import { BookDocType, BookMetadata } from "@oboku/shared"
import { Extractor } from "node-unrar-js"
import { saveCoverFromRarArchiveToBucket } from "@libs/books/covers/saveCoverFromRarArchiveToBucket"
import { Context } from "./types"
import { saveCoverFromExternalLinkToBucket } from "@libs/books/covers/saveCoverFromExternalLinkToBucket"
import { isBookCoverExist } from "@libs/books/covers/isBookCoverExist"

export const updateCover = async ({
  metadataList,
  archiveExtractor,
  book,
  ctx,
  tmpFilePath
}: {
  ctx: Context
  book: BookDocType
  metadataList: BookMetadata[]
  archiveExtractor?: Extractor<Uint8Array> | undefined
  tmpFilePath?: string
}) => {
  const currentMetadaForCover = book.metadata?.find(
    (metadata) => metadata.coverLink
  )
  const coverObjectKey = `cover-${ctx.userNameHex}-${ctx.book._id}`
  const metadataForCover = metadataList.find((metadata) => metadata.coverLink)

  if (
    metadataForCover?.type === currentMetadaForCover?.type &&
    metadataForCover?.coverLink &&
    metadataForCover.coverLink === currentMetadaForCover?.coverLink &&
    (await isBookCoverExist(coverObjectKey))
  ) {
    console.log(
      `Skipping cover update for ${book._id} since the current and new cover link are equals`
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
      metadataForCover.coverLink
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
      metadataForCover.coverLink
    )

    return
  }

  if (
    metadataForCover?.type === "googleBookApi" &&
    metadataForCover.coverLink
  ) {
    await saveCoverFromExternalLinkToBucket(
      ctx,
      ctx.book._id,
      metadataForCover.coverLink
    )

    return
  }
}
