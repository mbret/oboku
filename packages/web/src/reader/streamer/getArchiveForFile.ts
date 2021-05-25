import { Archive, createArchiveFromText } from "@oboku/reader-streamer";
import { loadAsync } from "jszip";
import { RarArchive } from "../../archive/types";
import { getBookFile } from "../../download/useBookFile";
import { PromiseReturnType } from "../../types";

const epubMimeTypes = ['application/epub+zip']

export const getArchiveForFile = async (file: NonNullable<PromiseReturnType<typeof getBookFile>>): Promise<Archive | undefined> => {

  const normalizedName = file.name.toLowerCase()

  if (
    normalizedName.endsWith(`.epub`)
    || normalizedName.endsWith(`.cbz`)
    || epubMimeTypes.includes(file.data.type)
  ) {
    return getArchiveForZipFile(file)
  }

  if (normalizedName.endsWith(`.txt`)) {
    return createArchiveFromText(file.data)
  }

  return undefined
}

const getArchiveForZipFile = async (file: NonNullable<PromiseReturnType<typeof getBookFile>>) => {
  const jszip = await loadAsync(file.data)

  return {
    filename: file.name,
    files: Object.values(jszip.files).map(file => ({
      dir: file.dir,
      name: file.name,
      blob: () => file.async('blob'),
      string: () => file.async('string'),
      base64: () => file.async('base64'),
      // this is private API
      // @ts-ignore
      size: file._data.uncompressedSize,
    }))
  }
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
          const archive: RarArchive = await archiveOpenFile(file.data, undefined)

          masterResolve({
            filename: file.name,
            files: archive.entries.map(file => ({
              dir: !file.is_file,
              name: file.name,
              blob: () => new Promise<Blob>((resolve, reject) => {
                file.readData((data, error) => {
                  if (error) return reject(error)
                  resolve(new Blob([data]))
                })
              }),
              string: () => new Promise<string>((resolve, reject) => {
                file.readData((data, error) => {
                  if (error) return reject(error)
                  let binary = '';
                  let bytes = new Uint8Array(data);
                  let len = bytes.byteLength;
                  for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                  }
                  resolve(window.btoa(binary))
                })
              }),
              base64: () => new Promise<string>((resolve, reject) => {
                file.readData((data, error) => {
                  if (error) return reject(error)
                  let binary = '';
                  let bytes = new Uint8Array(data);
                  let len = bytes.byteLength;
                  for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                  }
                  resolve(window.btoa(binary))
                })
              }),
              // this is private API
              // @ts-ignore
              size: file.size_uncompressed
            }))
          })
        } catch (e) {
          reject(e)
        }
      })
    } catch (e) {
      return reject(e)
    }
  })

}