import { BookMetadata } from "@oboku/shared"
import { Extractor } from "node-unrar-js"

export const getMetadataFromFile = async (
  extractor: Extractor<Uint8Array>,
  contentType: string
): Promise<BookMetadata> => {
  const list = extractor.getFileList()
  const fileHeaders = [...list.fileHeaders]

  const opfFile = fileHeaders.find((header) => header.name.endsWith(`.opf`))
  const archiveIsNotEpub = !opfFile
  const onlyFileHeaders = fileHeaders.filter(
    (header) => !header.flags.directory
  )

  if (archiveIsNotEpub) {
    return {
      type: "file",
      contentType,
      pageCount: onlyFileHeaders.length
    }
  }

  return {
    type: "file",
    contentType,
    pageCount: onlyFileHeaders.length
  }
}
