import {
  generateManifestFromArchive,
  generateResourceFromArchive
} from "@prose-reader/streamer"
import { STREAMER_URL_PREFIX } from "../../constants.shared"
import {
  FileNotFoundError,
  FileNotSupportedError,
  loadBook
} from "./loadBook.sw"

export const readerFetchListener = (event: FetchEvent) => {
  const url = new URL(event.request.url)
  const shouldIntercept = url.pathname.startsWith(`/${STREAMER_URL_PREFIX}`)

  if (shouldIntercept) {
    const { epubFileName } = extractInfoFromEvent(event)

    event.respondWith(
      (async () => {
        try {
          const archive = await loadBook(epubFileName)

          /**
           * Hit to manifest
           */
          if (url.pathname.endsWith(`/manifest`)) {
            const manifest = await generateManifestFromArchive(archive, {
              baseUrl: `${url.origin}/${STREAMER_URL_PREFIX}/${epubFileName}/`
            })

            return new Response(JSON.stringify(manifest), { status: 200 })
          }

          /**
           * Hit to resources
           */
          const resourcePath = getResourcePath(event)

          const resource = await generateResourceFromArchive(
            archive,
            resourcePath
          )

          return new Response(resource.body, {
            ...resource.params,
            status: 200
          })
        } catch (e) {
          if (e instanceof FileNotSupportedError) {
            return new Response(e.message, { status: 415 })
          }
          if (e instanceof FileNotFoundError) {
            return new Response(e.message, { status: 404 })
          }

          console.error(e)

          return new Response((e as any)?.message, { status: 500 })
        }
      })()
    )
  }
}

const extractEpubName = (url: string) => {
  const { pathname } = new URL(url)
  const urlWithoutPrefix = pathname.substring(`/${STREAMER_URL_PREFIX}/`.length)
  const nextSlashIndex = urlWithoutPrefix.indexOf("/")

  if (nextSlashIndex !== -1) {
    return urlWithoutPrefix.substring(0, urlWithoutPrefix.indexOf("/"))
  }

  return urlWithoutPrefix
}

const extractInfoFromEvent = (event: FetchEvent) => {
  const uri = new URL(event.request.url)
  const epubFileName = extractEpubName(event.request.url)
  const epubUrl = decodeURI(
    `${uri.origin}/${STREAMER_URL_PREFIX}/${epubFileName}`
  )

  return {
    epubUrl,
    epubFileName
  }
}

const getResourcePath = (event: FetchEvent) => {
  const url = new URL(event.request.url)
  const { epubFileName } = extractInfoFromEvent(event)

  return decodeURIComponent(
    url.pathname.replace(`/${STREAMER_URL_PREFIX}/${epubFileName}/`, ``)
  )
}
