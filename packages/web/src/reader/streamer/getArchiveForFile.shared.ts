import {
  Archive,
  createArchiveFromJszip,
  createArchiveFromText
} from "@prose-reader/streamer"
import { loadAsync } from "jszip"
import { Report } from "../../debug/report.shared"
import { getBookFile } from "../../download/getBookFile.shared"
import { PromiseReturnType } from "../../types"
import { Archive as LibARchive } from "libarchive.js"
import { CompressedFile } from "libarchive.js/dist/build/compiled/compressed-file"

const jsZipCompatibleMimeTypes = [`application/epub+zip`, `application/x-cbz`]

const loadDataWithJsZip = async (data: Blob | File) => {
  try {
    return await loadAsync(data)
  } catch (e) {
    Report.error(
      "loadDataWithJsZip: An error occurred while loading file with jszip"
    )

    throw e
  }
}

export const getArchiveForZipFile = async (
  file: NonNullable<PromiseReturnType<typeof getBookFile>>
): Promise<Archive | undefined> => {
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
          name: file.name
        })
      } catch (e) {
        Report.error(
          "createArchiveFromJszip: An error occurred while creating archive from jszip"
        )

        throw e
      }
    }

    if (normalizedName.endsWith(`.txt`)) {
      return createArchiveFromText(file.data)
    }

    return undefined
  } catch (e) {
    Report.error(
      "getArchiveForFile: An error occurred while getting archive for file"
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
  file: NonNullable<PromiseReturnType<typeof getBookFile>>
) => {
  const rarArchive = await LibARchive.open(file.data)

  const objArray = await rarArchive.getFilesArray()

  const archive: Archive = {
    close: () => rarArchive.close(),
    filename: file.name,
    files: objArray.map((item: { file: CompressedFile; path: string }) => ({
      dir: false,
      basename: item.file.name,
      size: item.file.size,
      uri: `${item.path}${item.file.name}`,
      base64: async () => {
        return ``
      },
      blob: async () => {
        const file = await (item.file.extract() as Promise<File>)

        return file
      },
      string: async () => {
        const file = await (item.file.extract() as Promise<File>)

        return file.text()
      }
    }))
  }

  return archive
}
