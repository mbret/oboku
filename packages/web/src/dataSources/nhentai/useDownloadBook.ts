import { useCallback } from "react"
import { ObokuPlugin } from "@oboku/plugin-front"
import { dataSourceHelpers } from "@oboku/shared";
import { BASE_URI, UNIQUE_RESOURCE_IDENTIFIER } from "./constants"

type StreamOutput = { baseUri: string, response: Response, progress: number }

export const useDownloadBook: ObokuPlugin[`useDownloadBook`] = ({ apiUri }) => {
  return useCallback(async ({ resourceId }) => {
    const galleryId = dataSourceHelpers.extractIdFromResourceId(UNIQUE_RESOURCE_IDENTIFIER, resourceId)

    const uri = `${BASE_URI}/g/${galleryId}`
    const response = await fetch(`${apiUri}/cors?url=${uri}`, {
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

    const stream = getGalleryPages(apiUri, pagesGalleryId, thumbnailPages)

    return { data: stream }
  }, [apiUri])
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

function getUrlExtension(url: string) {
  return url.split(/[#?]/)[0]?.split('.')?.pop()?.trim();
}

const getGalleryPages = (apiUri: string, galleryId: string, thumbnailPages: string[]) => {
  let cancelled = false

  return new ReadableStream<StreamOutput>({
    start: async (controller: ReadableStreamController<StreamOutput>) => {
      try {
        const downloadPage = async (index: number) => {
          const currentThumbSrc = thumbnailPages[index] || `dummy.jpg`
          const extension = getUrlExtension(currentThumbSrc) || `jpg`
          const imgBaseUri = `${index + 1}.${extension}`
          const imgUri = `https://i.nhentai.net/galleries/${galleryId}/${imgBaseUri}`
          const response = await fetch(`${apiUri}/cors?url=${imgUri}`, {
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