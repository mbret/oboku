import { saveCoverFromZipArchiveToBucket } from "@libs/books/covers/saveCoverFromZipArchiveToBucket"
import type { BookDocType, BookMetadata } from "@oboku/shared"
import type { Extractor } from "node-unrar-js"
import { saveCoverFromRarArchiveToBucket } from "@libs/books/covers/saveCoverFromRarArchiveToBucket"
import type { Context } from "./types"
import { saveCoverFromExternalLinkToBucket } from "@libs/books/covers/saveCoverFromExternalLinkToBucket"
import { isCoverExist } from "@libs/books/covers/isCoverExist"

export const updateCover = async ({
  metadataList,
  archiveExtractor,
  book,
  ctx,
  tmpFilePath,
}: {
  ctx: Context
  book: BookDocType
  metadataList: BookMetadata[]
  archiveExtractor?: Extractor<Uint8Array> | undefined
  tmpFilePath?: string
}) => {
  const currentMetadaForCover = book.metadata?.find(
    (metadata) => metadata.coverLink,
  )
  const coverObjectKey = `cover-${ctx.userNameHex}-${ctx.book._id}`
  const metadataForCover = metadataList.find((metadata) => metadata.coverLink)

  if (
    metadataForCover?.type === currentMetadaForCover?.type &&
    metadataForCover?.coverLink &&
    metadataForCover.coverLink === currentMetadaForCover?.coverLink &&
    (await isCoverExist(coverObjectKey))
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
    )

    return
  }

  if (
    metadataForCover?.type === "googleBookApi" &&
    metadataForCover.coverLink
  ) {
    const objectKey = `cover-${ctx.userNameHex}-${ctx.book._id}`

    await saveCoverFromExternalLinkToBucket(
      objectKey,
      metadataForCover.coverLink,
    )

    return
  }
}
