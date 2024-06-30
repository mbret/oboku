/// <reference lib="webworker" />
import {
  generateManifestFromArchive,
  generateResourceFromArchive
} from "@prose-reader/streamer"
import { STREAMER_URL_PREFIX } from "../../constants.shared"
import { loadBook } from "./loadBook.sw"
import { getResourcePathFromUrl } from "./getResourcePathFromUrl.shared"
import { getManifestBaseUrl } from "./getManifestBaseUrl.shared"
import { FileNotFoundError, FileNotSupportedError } from "../errors.shared"

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
              baseUrl: getManifestBaseUrl(url.origin, epubFileName)
            })

            return new Response(JSON.stringify(manifest), { status: 200 })
          }

          /**
           * Hit to resources
           */
          const resourcePath = getResourcePathFromUrl(event.request.url)

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
