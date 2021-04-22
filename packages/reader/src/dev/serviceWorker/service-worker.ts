/// <reference lib="webworker" />
//@ts-ignore
export default null;
declare var self: ServiceWorkerGlobalScope

import { loadEpub } from './loadEpub';
import { generateResourceResponse, generateManifestResponse } from '../../streamer';

self.addEventListener('install', function (e: any) {
  console.log('service worker install')
  e.waitUntil(self.skipWaiting()); // Activate worker immediately

  setTimeout(async () => {
    const client = await self.clients.get(e.clientId);
    if (!e.clientId) {
      console.log('no client id')
      return
    }
    client?.postMessage({
      msg: "Hey I just got a fetch from you!",
    })
  })
})

self.addEventListener('activate', function (event: any) {
  event.waitUntil((self as any).clients.claim()); // Become available to all pages
})

const URL_PREFIX = `reader`

/**
 * Spin up the oboku reader streamer.
 * We need to provide our custom function to retrieve the archive.
 * This getter can fetch the epub from internet, indexedDB, etc
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url)

  console.log(`HANDLE`, url, url.pathname.startsWith(`/${URL_PREFIX}/`))

  if (url.pathname.startsWith(`/${URL_PREFIX}`)) {

    const { epubUrl, epubFileName } = extractInfoFromEvent(event)

    event.respondWith((async () => {
      try {
        const archive = await loadEpub(epubUrl)

        /**
         * Hit to manifest
         */
        if (url.pathname.endsWith(`/manifest`)) {
          return await generateManifestResponse(archive, { baseUrl: `${url.origin}/${URL_PREFIX}/${epubFileName}` })
        }

        /**
         * Hit to resources
         */
        const resourcePath = getResourcePath(event)
        
        return await generateResourceResponse(archive, resourcePath)
      } catch (e) {
        console.error(e)

        return new Response(e.message, { status: 500 })
      }
    })())
  }
});

export const extractEpubName = (url: string) => {
  const { pathname } = new URL(url)
  const urlWithoutPrefix = pathname.substring(`/${URL_PREFIX}/`.length)
  const nextSlashIndex = urlWithoutPrefix.indexOf('/')

  if (nextSlashIndex !== -1) {
    return urlWithoutPrefix.substring(0, urlWithoutPrefix.indexOf('/'))
  }

  return urlWithoutPrefix
}


export const extractInfoFromEvent = (event: FetchEvent) => {
  const uri = new URL(event.request.url)
  const epubFileName = extractEpubName(event.request.url)
  const epubUrl = decodeURI(`${uri.origin}/epubs/${epubFileName}`)

  return {
    epubUrl,
    epubFileName
  }
}

export const getResourcePath = (event: FetchEvent) => {
  const url = new URL(event.request.url)
  const { epubFileName } = extractInfoFromEvent(event)

  return decodeURIComponent(url.pathname.replace(`/${URL_PREFIX}/${epubFileName}/`, ``))
}