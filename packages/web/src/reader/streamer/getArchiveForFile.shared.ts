import { Archive, createArchiveFromJszip, createArchiveFromText } from "@prose-reader/streamer";
import { createArchiveFromArrayBufferList } from "@prose-reader/streamer";
import { loadAsync } from "jszip";
import { RarArchive } from "../../archive/types";
import { getBookFile } from "../../download/getBookFile.shared";
import { PromiseReturnType } from "../../types";

const jsZipCompatibleMimeTypes = [`application/epub+zip`, `application/x-cbz`]

export const getArchiveForFile = async (file: NonNullable<PromiseReturnType<typeof getBookFile>>): Promise<Archive | undefined> => {

  const normalizedName = file.name.toLowerCase()

  if (
    normalizedName.endsWith(`.epub`)
    || normalizedName.endsWith(`.cbz`)
    || jsZipCompatibleMimeTypes.includes(file.data.type)
  ) {
    const jszip = await loadAsync(file.data)

    return createArchiveFromJszip(jszip, { orderByAlpha: true, name: file.name })
  }

  if (normalizedName.endsWith(`.txt`)) {
    return createArchiveFromText(file.data)
  }

  return undefined
}

/**
 * Does not work within service worker context yet.
 * Library use XhtmlHttpRequest which exist in worker and main thread but not SW.
 * We fallback to app main thread for rar archives
 */
export const getArchiveForRarFile = async (file: NonNullable<PromiseReturnType<typeof getBookFile>>) => {
  return new Promise<Archive>((masterResolve, reject) => {
    try {
      // @ts-ignore
      loadArchiveFormats(['rar'], async () => {
        try {
          // @ts-ignore
          const rarArchive: RarArchive = await archiveOpenFile(file.data, undefined)

          const archive = await createArchiveFromArrayBufferList(
            rarArchive.entries.map(file => ({
              isDir: !file.is_file,
              name: file.name,
              size: file.size_uncompressed,
              data: () => new Promise<ArrayBuffer>((resolve, reject) => {
                file.readData((data, error) => {
                  if (error) return reject(error)
                  resolve(data)
                })
              })
            })),
            { orderByAlpha: true, name: file.name }
          )

          masterResolve(archive)
        } catch (e) {
          reject(e)
        }
      })
    } catch (e) {
      return reject(e)
    }
  })

}