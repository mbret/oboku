import { useCallback } from "react"
import { UseDownloadHook } from "../types"
import { dataSourceHelpers, dataSourcePlugins } from "@oboku/shared";
import { BASE_URI } from "./constants"
import { API_URI } from "../../constants"

type StreamOutput = { baseUri: string, response: Response, progress: number }

export const useDownloadBook: UseDownloadHook = () => {
  return useCallback(async ({ resourceId }) => {
    const galleryId = dataSourceHelpers.extractIdFromResourceId(dataSourcePlugins.NHENTAI!.uniqueResourceIdentifier, resourceId)

    let reader: ReadableStreamDefaultReader<StreamOutput> | undefined

    try {
      const uri = `${BASE_URI}/g/${galleryId}`
      const response = await fetch(`${API_URI}/cors?url=${uri}`, {
        referrerPolicy: `no-referrer`
      })

      const data = await response.text()

      const parser = new DOMParser()
      const doc = parser.parseFromString(data, `text/html`)

      const thumbnailPages = resolvePagesForGallery(doc)
      const pagesGalleryId = resolvePagesGalleryRealId(doc)

      if (!pagesGalleryId || thumbnailPages.length === 0) {
        throw new Error(`Unable to find book data`)
      }

      const stream = getGalleryPages(pagesGalleryId, thumbnailPages)

      return { data: stream }
    } catch (e) {
      // cancel stream in case of
      reader?.cancel().catch(() => { })

      throw e
    }
  }, [])
}

const resolvePagesForGallery = (doc: Document) => {
  // we use .lazyload to ignore the second no script img tag
  return Array.from(doc.querySelectorAll(`#content #thumbnail-container .thumb-container a img.lazyload`)).map(element => (element as HTMLImageElement).dataset.src || ``)
}

const resolvePagesGalleryRealId = (doc: Document) => {
  const firstImgElementForFirstThumbnailElement = doc.querySelector(`#content #thumbnail-container .thumb-container a img`)

  if (!firstImgElementForFirstThumbnailElement) return

  // we get something like https://t7.nhentai.net/galleries/3147/1t.jpg
  // this gives us the correct gallery id. Because sometime the gallery id for direct image link is different from
  // the master one
  const firstImgElementForFirstThumbnailLink = (firstImgElementForFirstThumbnailElement as HTMLImageElement).dataset.src || ``
  const knownPrefix = `/galleries/`
  // we end up with 3147/1t.jpg
  const removeUnwantedPart = firstImgElementForFirstThumbnailLink
    .substring(firstImgElementForFirstThumbnailLink.lastIndexOf(knownPrefix) + knownPrefix.length)
  const [imgGalleryId] = removeUnwantedPart.split(`/`)

  return imgGalleryId
}

function getUrlExtension( url: string ) {
  return url.split(/[#?]/)[0]?.split('.')?.pop()?.trim();
}

const getGalleryPages = (galleryId: string, thumbnailPages: string[]) => {
  let cancelled = false

  return new ReadableStream<StreamOutput>({
    start: async (controller: ReadableStreamController<StreamOutput>) => {
      try {
        const downloadPage = async (index: number) => {
          const currentThumbSrc = thumbnailPages[index] || `dummy.jpg`
          const extension = getUrlExtension(currentThumbSrc) || `jpg`
          console.log(thumbnailPages, currentThumbSrc, extension)
          const imgBaseUri = `${index + 1}.${extension}`
          const imgUri = `https://i.nhentai.net/galleries/${galleryId}/${imgBaseUri}`
          const response = await fetch(`${API_URI}/cors?url=${imgUri}`, {
            referrerPolicy: `no-referrer`
          })

          if (cancelled) return

          if (response.status !== 200) {
            throw new Error(`Unable to retrieve page ${imgUri}`)
          }

          controller.enqueue({ baseUri: imgBaseUri, response, progress: index / thumbnailPages.length })

          if (index < (thumbnailPages.length - 1)) {
            await downloadPage(index + 1)
          }
        }

        await downloadPage(0)

        controller.close()
      } catch (e) {
        controller.error(e)
      }
    },
    cancel() {
      cancelled = true
    }
  })
}