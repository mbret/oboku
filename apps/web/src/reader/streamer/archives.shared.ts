import {
  type Archive,
  createArchiveFromText,
} from "@prose-reader/archive-reader"
import { createArchiveFromZipJs } from "@prose-reader/archive-reader/archives/createArchiveFromZipJs"
import { BlobReader, ZipReader } from "@zip.js/zip.js"
import { Logger } from "../../debug/logger.shared"
import type { getBookFile } from "../../download/getBookFile.shared"
import { StreamerFileNotSupportedError } from "../../errors/errors.shared"
import { isPotentialZipFile } from "@oboku/shared"

const RAR_MIME_TYPES = [
  "application/x-rar-compressed",
  "application/vnd.rar",
  "application/x-rar",
]

export const isRarFile = (
  file: NonNullable<Awaited<ReturnType<typeof getBookFile>>>,
) => {
  const normalizedName = file.data.name.toLowerCase()

  return (
    RAR_MIME_TYPES.includes(file.data.type) ||
    normalizedName.endsWith(".rar") ||
    normalizedName.endsWith(".cbr")
  )
}

export const isPdfFile = (
  file: NonNullable<Awaited<ReturnType<typeof getBookFile>>>,
) => {
  const normalizedName = file.data.name.toLowerCase()

  return (
    file.data.type.startsWith("application/pdf") ||
    normalizedName.endsWith(".pdf")
  )
}

export const getEncodingFormat = (
  file: NonNullable<Awaited<ReturnType<typeof getBookFile>>>,
) => (file.data.type.length > 0 ? file.data.type : undefined)

export const getArchiveForZipFile = async (
  file: NonNullable<Awaited<ReturnType<typeof getBookFile>>>,
): Promise<Archive> => {
  try {
    const normalizedName = file.data.name.toLowerCase()
    const encodingFormat = getEncodingFormat(file)

    if (
      isPotentialZipFile({ name: file.data.name, mimeType: file.data.type })
    ) {
      try {
        const zipReader = new ZipReader(new BlobReader(file.data))

        return await createArchiveFromZipJs(zipReader, {
          orderByAlpha: true,
          name: file.data.name,
          encodingFormat,
        })
      } catch (e) {
        Logger.error(
          "createArchiveFromZipJs: An error occurred while creating archive from zip.js",
        )
        console.error(e)

        throw e
      }
    }

    if (normalizedName.endsWith(`.txt`)) {
      return createArchiveFromText(file.data, {
        mimeType: encodingFormat ?? "text/plain",
      })
    }

    throw new StreamerFileNotSupportedError(`FileNotSupportedError`)
  } catch (e) {
    Logger.error(
      "getArchiveForFile: An error occurred while getting archive for file",
    )
    console.error(e)

    throw e
  }
}
