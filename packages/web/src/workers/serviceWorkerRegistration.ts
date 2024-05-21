// This optional code is used to register a service worker.
// register() is not called by default.

import { Report } from "../debug/report.shared"

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.

// To learn more about the benefits of this model and instructions on how to
// opt-in, read https://cra.link/PWA

const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === "[::1]" ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
)

const CHECK_FOR_SW_UPDATE_EVERY = 600000 // 600000ms = 10mn

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void
  onUpdate?: (registration: ServiceWorkerRegistration) => void
  onWaitingServiceWorkerFound?: (
    registration: ServiceWorkerRegistration
  ) => void
}

export function register(config?: Config) {
  if ("serviceWorker" in navigator) {
    // The URL constructor is available in all browsers that support SW.
    const publicUrl = new URL("", window.location.href)

    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if PUBLIC_URL is on a different origin
      // from what our page is served on. This might happen if a CDN is used to
      // serve assets; see https://github.com/facebook/create-react-app/issues/2374
      return
    }

    const onWindowLoad = () => {
      const swUrl =
        import.meta.env.MODE === "production" ||
        /**
         * firefox does not support module type for dev service worker.
         * Please build and copy dist service worker in public when developing with firefox
         */
        navigator.userAgent.includes("Firefox/")
          ? "/service-worker.js"
          : "/dev-sw.js?dev-sw"

      if (isLocalhost) {
        // This is running on localhost. Let's check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config)

        // Add some additional logging to localhost, pointing developers to the
        // service worker/PWA documentation.
        navigator.serviceWorker.ready.then(() => {
          Report.log(
            "This web app is being served cache-first by a service " +
              "worker. To learn more, visit https://cra.link/PWA"
          )
        })
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config)
      }
    }

    if (document.readyState === "complete") {
      onWindowLoad()
    } else {
      window.addEventListener("load", onWindowLoad)
    }
  }
}

function registerValidSW(swUrl: string, config?: Config) {
  navigator.serviceWorker
    .register(swUrl, {
      type: import.meta.env.MODE === "production" ? "classic" : "module"
    })
    .then((registration) => {
      console.log("registered", registration.waiting)
      if (registration.waiting) {
        if (config?.onWaitingServiceWorkerFound) {
          config?.onWaitingServiceWorkerFound(registration)
        }
      }

      registration.onupdatefound = () => {
        const installingWorker = registration.installing
        if (installingWorker == null) {
          return
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated pre-cached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.
              console.log(
                "New content is available and will be used when all " +
                  "tabs for this page are closed. See https://cra.link/PWA."
              )

              // Execute callback
              if (config && config.onUpdate) {
                config.onUpdate(registration)
              }
            } else {
              // At this point, everything has been pre-cached.
              // It's the perfect time to display a
              // "Content is cached for offline use." message.
              console.log("Content is cached for offline use.")

              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration)
              }
            }
          }
        }
      }

      // Manually check if there is a new update available
      // @see https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#manual_updates
      setInterval(() => {
        registration.update().catch((error) => {
          console.error(error.message)
        })
      }, CHECK_FOR_SW_UPDATE_EVERY)
    })
    .catch((error) => {
      console.error("Error during service worker registration:", error)
    })
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { "Service-Worker": "script" }
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get("content-type")
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf("javascript") === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload()
          })
        })
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config)
      }
    })
    .catch(() => {
      console.log(
        "No internet connection found. App is running in offline mode."
      )
    })
}
