import type { BookMetadata } from "@oboku/shared"
import type { Extractor } from "node-unrar-js"
import path from "path"
import { COVER_ALLOWED_EXT } from "src/constants"

export const getMetadataFromRarArchive = async (
  extractor: Extractor<Uint8Array>,
  contentType: string,
): Promise<BookMetadata> => {
  const list = extractor.getFileList()
  const fileHeaders = [...list.fileHeaders]

  const firstImageFound = fileHeaders.find((fileHeader) => {
    const isAllowedImage = COVER_ALLOWED_EXT.includes(
      path.extname(fileHeader.name).toLowerCase(),
    )

    return isAllowedImage
  })

  const opfFile = fileHeaders.find((header) => header.name.endsWith(`.opf`))
  const archiveIsNotEpub = !opfFile
  const onlyFileHeaders = fileHeaders.filter(
    (header) => !header.flags.directory,
  )

  if (archiveIsNotEpub) {
    return {
      type: "file",
      contentType,
      pageCount: onlyFileHeaders.length,
      coverLink: firstImageFound?.name,
    }
  }

  return {
    type: "file",
    contentType,
    pageCount: onlyFileHeaders.length,
    coverLink: firstImageFound?.name,
  }
}
