import { useCallback } from "react"
import {
  PLUGIN_IMHENTAI_BASE_URI,
  PLUGIN_IMHENTAI_UNIQUE_RESOURCE_IDENTIFIER
} from "@oboku/shared"
import { ObokuPlugin, dataSourceHelpers } from "../plugin-front"

type StreamOutput = { baseUri: string; response: Response; progress: number }

export const useDownloadBook: ObokuPlugin[`useDownloadBook`] = ({ apiUri }) => {
  return useCallback(async ({ resourceId }) => {
    const galleryId = dataSourceHelpers.extractIdFromResourceId(
      PLUGIN_IMHENTAI_UNIQUE_RESOURCE_IDENTIFIER,
      resourceId
    )

    const uri = `${PLUGIN_IMHENTAI_BASE_URI}/gallery/${galleryId}`
    const response = await fetch(`${apiUri}/cors?url=${uri}`, {
      referrerPolicy: `no-referrer`
    })

    const data = await response.text()

    const parser = new DOMParser()
    const doc = parser.parseFromString(data, `text/html`)

    const thumbnailPages = resolvePagesForGallery(doc)
    const directPagesBaseUri = resolveDirectPageBaseUri(doc)

    if (!directPagesBaseUri || thumbnailPages.length === 0) {
      throw new Error(`Unable to find book data`)
    }

    const stream = getGalleryPages(apiUri, directPagesBaseUri, thumbnailPages)

    return { data: stream }
  }, [])
}

const resolveFirstThumbnailImg = (doc: Document) =>
  doc.querySelector(`#append_thumbs .gthumb img`)

const resolvePagesForGallery = (doc: Document) => {
  const numberOfPages = parseInt(
    doc
      .querySelector(`.galleries_info .pages`)
      ?.textContent?.replace(`Pages: `, ``) || `0`
  )
  const firstThumbImg = resolveFirstThumbnailImg(doc)

  if (!firstThumbImg) return []

  const firstThumUriTemplate = (firstThumbImg as HTMLImageElement).dataset.src

  // we use .lazyload to ignore the second no script img tag
  return Array.from(Array(numberOfPages)).map(
    (_, index) => firstThumUriTemplate?.replace(`1t.`, `${index}t.`) || ``
  )
}

const resolveDirectPageBaseUri = (doc: Document) => {
  const firstImgElementForFirstThumbnailElement = resolveFirstThumbnailImg(doc)

  if (!firstImgElementForFirstThumbnailElement) return

  const firstImgElementForFirstThumbnailLink =
    (firstImgElementForFirstThumbnailElement as HTMLImageElement).dataset.src ||
    ``
  const uriWithoutFileName = firstImgElementForFirstThumbnailLink.substring(
    0,
    firstImgElementForFirstThumbnailLink.lastIndexOf(`/`)
  )

  return uriWithoutFileName
}

function getUrlExtension(url: string) {
  return url.split(/[#?]/)[0]?.split(`.`)?.pop()?.trim()
}

const getGalleryPages = (
  apiUri: string,
  directPagesBaseUri: string,
  thumbnailPages: string[]
) => {
  let cancelled = false

  return new ReadableStream<StreamOutput>({
    start: async (controller) => {
      try {
        const downloadPage = async (index: number) => {
          const currentThumbSrc = thumbnailPages[index] || `dummy.jpg`
          const extension = getUrlExtension(currentThumbSrc) || `jpg`
          const imgBaseUri = `${index + 1}.${extension}`
          const imgUri = `${directPagesBaseUri}/${imgBaseUri}`
          const response = await fetch(`${apiUri}/cors?url=${imgUri}`, {
            referrerPolicy: `no-referrer`
          })

          if (cancelled) return

          if (response.status !== 200) {
            throw new Error(`Unable to retrieve page ${imgUri}`)
          }

          controller.enqueue({
            baseUri: imgBaseUri,
            response,
            progress: index / thumbnailPages.length
          })

          if (index < thumbnailPages.length - 1) {
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
