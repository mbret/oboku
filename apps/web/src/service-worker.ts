/// <reference lib="webworker" />

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
// You can also remove this file if you'd prefer not to use a
// service worker, and the Workbox build step will be skipped.

import "./debug/enableProseReaderDebug.sw"
import { clientsClaim } from "workbox-core"
import { ExpirationPlugin } from "workbox-expiration"
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching"
import type { PrecacheEntry } from "workbox-precaching"
import { registerRoute } from "workbox-routing"
import { StaleWhileRevalidate } from "workbox-strategies"
import {
  API_URL,
  API_URL_2,
  API_URL_3,
  API_URL_4,
  STREAMER_URL_PREFIX,
} from "./config/envs.shared"
import { runCoversCacheCleanup } from "./covers/registerCoversCacheCleanup.sw"
import { coversFetchListener } from "./covers/coversFetchListener.sw"
import { swStreamer } from "./reader/streamer/swStreamer.sw"
import { serviceWorkerCommunication } from "./workers/communication/communication.sw"
import { SwTask } from "./workers/communication/types.shared"
import { runOldRxdbDatabasesCleanup } from "./rxdb/cleanupOldRxdbDatabases.sw"
import { authCallbackEntrypoints } from "./plugins/common/authCallbackEntrypoints.shared"
import { assertNever } from "@oboku/shared"

declare const self: ServiceWorkerGlobalScope

clientsClaim()

function shortHash(value: string) {
  let hash = 5381

  for (let index = 0; index < value.length; index++) {
    hash = ((hash << 5) + hash + value.charCodeAt(index)) | 0
  }

  return (hash >>> 0).toString(36)
}

const runtimeConfigRevision = shortHash(
  [API_URL, API_URL_2, API_URL_3, API_URL_4].join("|"),
)

/**
 * The container entrypoint substitutes the API origins into the built assets at
 * startup without changing their content-hashed filenames, so the entries the
 * build emitted with `revision: null` stay keyed by URL alone and a returning
 * client would keep serving the bundle rendered for the previous configuration.
 * Folding the resolved origins into every revision moves those cache keys
 * whenever the configuration changes.
 */
function withRuntimeConfigRevision(
  manifest: (PrecacheEntry | string)[],
): PrecacheEntry[] {
  return manifest.map(function keyEntryOnRuntimeConfig(entry) {
    const { url, revision, integrity } =
      typeof entry === "string" ? { url: entry } : entry

    return {
      url,
      integrity,
      revision: `${revision ?? ""}-${runtimeConfigRevision}`,
    }
  })
}

if (import.meta.env.PROD) {
  precacheAndRoute(withRuntimeConfigRevision(self.__WB_MANIFEST))
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Set up App Shell-style routing, so that all navigation requests
// are fulfilled with your index.html shell. Learn more at
// https://developers.google.com/web/fundamentals/architecture/app-shell
const appShellExcludedPathRegexps = [
  // Skip framework/internal asset paths such as "/_app" or "/_vercel".
  /^\/_/,
  // Skip dedicated OAuth callback pages that live outside the SPA shell.
  ...authCallbackEntrypoints.map(({ pathname }) => {
    return new RegExp(`^${escapeRegExp(pathname)}$`)
  }),
  // Skip URLs that already point to a concrete file like "/image.png" or "/page.html".
  /\/[^/?]+\.[^/]+$/,
]

if (import.meta.env.PROD) {
  registerRoute(
    // Return false to exempt requests from being fulfilled by index.html.
    ({ request, url }: { request: Request; url: URL }) => {
      // If this isn't a navigation, skip.
      if (request.mode !== "navigate") {
        return false
      }

      if (
        appShellExcludedPathRegexps.some((pattern) =>
          pattern.test(url.pathname),
        )
      ) {
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

self.addEventListener("message", (event) => {
  const message = serviceWorkerCommunication.registerMessage(event)

  if (!message) return

  switch (message.type) {
    case "RUN_TASK": {
      const { task, profile } = message.payload

      switch (task) {
        case SwTask.CoversCacheCleanup:
          return event.waitUntil(runCoversCacheCleanup(profile))
        case SwTask.OldRxdbDatabasesCleanup:
          return event.waitUntil(runOldRxdbDatabasesCleanup())
        default:
          return assertNever(task)
      }
    }
    case "SKIP_WAITING":
      return event.waitUntil(self.skipWaiting())
  }
})

self.addEventListener(`fetch`, (event) => {
  const isHandledByCovers = coversFetchListener(event)

  if (isHandledByCovers) return

  swStreamer.fetchEventListener(event)
})
