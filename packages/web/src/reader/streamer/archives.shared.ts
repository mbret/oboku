import {
  Archive,
  createArchiveFromJszip,
  createArchiveFromLibArchive,
  createArchiveFromText,
} from "@prose-reader/streamer"
import { loadAsync } from "jszip"
import { Report } from "../../debug/report.shared"
import { getBookFile } from "../../download/getBookFile.shared"
import { PromiseReturnType } from "../../types"
import { Archive as LibARchive } from "libarchive.js"
import { StreamerFileNotSupportedError } from "../../errors/errors.shared"

const jsZipCompatibleMimeTypes = [
  `application/epub+zip`,
  `application/x-cbz`,
  `application/zip`,
  `application/x-zip-compressed`,
]

const loadDataWithJsZip = async (data: Blob | File) => {
  try {
    return await loadAsync(data)
  } catch (e) {
    Report.error(
      "loadDataWithJsZip: An error occurred while loading file with jszip",
    )

    throw e
  }
}

export const isRarFile = (
  file: NonNullable<PromiseReturnType<typeof getBookFile>>,
) => {
  return file.data.name.endsWith(".rar") || file.data.name.endsWith(".cbr")
}

export const getArchiveForZipFile = async (
  file: NonNullable<PromiseReturnType<typeof getBookFile>>,
): Promise<Archive> => {
  try {
    const normalizedName = file.name.toLowerCase()

    if (
      normalizedName.endsWith(`.epub`) ||
      normalizedName.endsWith(`.cbz`) ||
      jsZipCompatibleMimeTypes.includes(file.data.type)
    ) {
      const jszip = await loadDataWithJsZip(file.data)

      try {
        return createArchiveFromJszip(jszip, {
          orderByAlpha: true,
          name: file.name,
        })
      } catch (e) {
        Report.error(
          "createArchiveFromJszip: An error occurred while creating archive from jszip",
        )

        throw e
      }
    }

    if (normalizedName.endsWith(`.txt`)) {
      return createArchiveFromText(file.data)
    }

    throw new StreamerFileNotSupportedError(`FileNotSupportedError`)
  } catch (e) {
    Report.error(
      "getArchiveForFile: An error occurred while getting archive for file",
    )

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
    name: file.name,
  })
}
