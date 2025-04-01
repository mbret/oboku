/// <reference lib="webworker" />

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
// You can also remove this file if you'd prefer not to use a
// service worker, and the Workbox build step will be skipped.

import { clientsClaim } from "workbox-core"
import { ExpirationPlugin } from "workbox-expiration"
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching"
import { registerRoute } from "workbox-routing"
import { StaleWhileRevalidate } from "workbox-strategies"
import { STREAMER_URL_PREFIX } from "./workers/constants.shared"
import { registerCoversCacheCleanup } from "./covers/registerCoversCacheCleanup.sw"
import { coversFetchListener } from "./covers/coversFetchListener.sw"
import { swStreamer } from "./reader/streamer/swStreamer.sw"
import { serviceWorkerCommunication } from "./workers/communication/communication.sw"
import {
  ConfigurationChangeMessage,
  SkipWaitingMessage,
} from "./workers/communication/types.shared"
import { serviceWorkerConfiguration } from "./config/configuration.sw"

declare const self: ServiceWorkerGlobalScope

clientsClaim()

// Precache all of the assets generated by your build process.
// Their URLs are injected into the manifest variable below.
// This variable must be present somewhere in your service worker file,
// even if you decide not to use precaching. See https://cra.link/PWA
if (import.meta.env.PROD) {
  precacheAndRoute(self.__WB_MANIFEST)
}

// Set up App Shell-style routing, so that all navigation requests
// are fulfilled with your index.html shell. Learn more at
// https://developers.google.com/web/fundamentals/architecture/app-shell
const fileExtensionRegexp = /\/[^\/?]+\.[^\/]+$/

if (import.meta.env.PROD) {
  registerRoute(
    // Return false to exempt requests from being fulfilled by index.html.
    ({ request, url }: { request: Request; url: URL }) => {
      // If this isn't a navigation, skip.
      if (request.mode !== "navigate") {
        return false
      }

      // If this is a URL that starts with /_, skip.
      if (url.pathname.startsWith("/_")) {
        return false
      }

      // If this looks like a URL for a resource, because it contains
      // a file extension, skip.
      if (url.pathname.match(fileExtensionRegexp)) {
        return false
      }

      // Return true to signal that we want to use the handler.
      return true
    },
    createHandlerBoundToURL("/index.html"),
  )
}

// An example runtime caching route for requests that aren't handled by the
// pre-cache, in this case same-origin .png requests like those from in public/
if (import.meta.env.PROD) {
  registerRoute(
    // Add in any other file extensions or routing criteria as needed.
    ({ url }) =>
      url.origin === self.location.origin &&
      !url.pathname.startsWith(`/${STREAMER_URL_PREFIX}`) &&
      url.pathname.endsWith(".png"),
    // Customize this strategy as needed, e.g., by changing to CacheFirst.
    new StaleWhileRevalidate({
      cacheName: "images",
      plugins: [
        // Ensure that once this runtime cache reaches a maximum size the
        // least-recently used images are removed.
        new ExpirationPlugin({ maxEntries: 50 }),
      ],
    }),
  )
}

self.addEventListener("message", serviceWorkerCommunication.registerMessage)

// current sw can update and install itself
serviceWorkerCommunication.watch(SkipWaitingMessage).subscribe(() => {
  console.log("skip waiting")

  self.skipWaiting().then(() => {
    // fetch fresh config as soom as the worker is ready
    serviceWorkerCommunication.askConfig()
  })
})

serviceWorkerCommunication
  .watch(ConfigurationChangeMessage)
  .subscribe((message) => {
    serviceWorkerConfiguration.update(message.payload)
  })

registerCoversCacheCleanup()

self.addEventListener(`fetch`, (event) => {
  const isHandledByCovers = coversFetchListener(event)

  if (isHandledByCovers) return

  swStreamer.fetchEventListener(event)
})
