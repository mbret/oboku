import {
  type Archive,
  createArchiveFromJszip,
  createArchiveFromLibArchive,
  createArchiveFromText,
} from "@prose-reader/streamer"
import { loadAsync as jszipLoadAsync } from "jszip"
import { Logger } from "../../debug/logger.shared"
import type { getBookFile } from "../../download/getBookFile.shared"
import type { PromiseReturnType } from "../../types"
import { Archive as LibARchive } from "libarchive.js"
import { StreamerFileNotSupportedError } from "../../errors/errors.shared"
import { isPotentialZipFile } from "@oboku/shared"

const loadDataWithJsZip = async (data: Blob | File) => {
  try {
    return await jszipLoadAsync(data)
  } catch (e) {
    Logger.error(
      "loadDataWithJsZip: An error occurred while loading file with jszip",
    )

    throw e
  }
}

const RAR_MIME_TYPES = [
  "application/x-rar-compressed",
  "application/vnd.rar",
  "application/x-rar",
]

export const isRarFile = (
  file: NonNullable<PromiseReturnType<typeof getBookFile>>,
) =>
  RAR_MIME_TYPES.includes(file.data.type) ||
  file.data.name.endsWith(".rar") ||
  file.data.name.endsWith(".cbr")

export const isPdfFile = (
  file: NonNullable<PromiseReturnType<typeof getBookFile>>,
) =>
  file.data.type.startsWith("application/pdf") ||
  file.data.name.endsWith(".pdf")

export const getArchiveForZipFile = async (
  file: NonNullable<PromiseReturnType<typeof getBookFile>>,
): Promise<Archive> => {
  try {
    const normalizedName = file.data.name.toLowerCase()

    if (
      isPotentialZipFile({ name: file.data.name, mimeType: file.data.type })
    ) {
      const jszip = await loadDataWithJsZip(file.data)

      try {
        return createArchiveFromJszip(jszip, {
          orderByAlpha: true,
          name: file.data.name,
        })
      } catch (e) {
        Logger.error(
          "createArchiveFromJszip: An error occurred while creating archive from jszip",
        )
        console.error(e)

        throw e
      }
    }

    if (normalizedName.endsWith(`.txt`)) {
      return createArchiveFromText(file.data)
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

/**
 * Does not work within service worker context yet.
 * Library use XhtmlHttpRequest which exist in worker and main thread but not SW.
 * We fallback to app main thread for rar archives
 */
export const getArchiveForRarFile = async (
  file: NonNullable<PromiseReturnType<typeof getBookFile>>,
) => {
  const archive = await LibARchive.open(file.data)

  return createArchiveFromLibArchive(archive, {
    orderByAlpha: true,
    name: file.data.name,
  })
}
