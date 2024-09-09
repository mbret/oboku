import {
  interval,
  switchMap,
  from,
  tap,
  ignoreElements,
  first,
  finalize,
  catchError,
  merge,
  defer,
  combineLatest,
  retry
} from "rxjs"
import { createSwDatabase } from "../rxdb/db.sw"
import { profileUpdate$ } from "../workers/messages.sw"
import { type WEB_OBOKU_PROFILE_REQUEST_MESSAGE_DATA } from "../workers/types"
import {
  getMetadataFromRequest,
  hasAnotherMoreRecentCoverForThisRequest
} from "./helpers.shared"
import { Report } from "../debug/report.shared"
import { SW_COVERS_CACHE_KEY } from "../constants.shared"

declare const self: ServiceWorkerGlobalScope

const cache$ = defer(() => from(caches.open(SW_COVERS_CACHE_KEY)))
const database$ = defer(() => from(createSwDatabase()))
const requestProfileUpdate$ = defer(() =>
  from(self.clients.matchAll()).pipe(
    tap((clients) =>
      clients.forEach((client) => {
        client.postMessage({
          type: "OBOKU_PROFILE_REQUEST_UPDATE"
        } satisfies WEB_OBOKU_PROFILE_REQUEST_MESSAGE_DATA)
      })
    ),
    ignoreElements()
  )
)
const crrentProfile$ = merge(
  profileUpdate$.pipe(first()),
  requestProfileUpdate$
)

const clearAllCovers = () => {
  return cache$.pipe(
    switchMap((cache) =>
      from(cache.keys()).pipe(
        switchMap((cacheKeys) =>
          from(Promise.all(cacheKeys.map((key) => cache.delete(key))))
        )
      )
    )
  )
}

export const registerCoversCacheCleanup = () => {
  const cleanupForProfile$ = database$.pipe(
    switchMap((db) =>
      from(db.book.find().exec()).pipe(
        switchMap((docs) =>
          cache$.pipe(
            switchMap((cache) => {
              return from(cache.keys()).pipe(
                switchMap((cacheKeys) => {
                  return crrentProfile$.pipe(
                    switchMap((profile) => {
                      /**
                       * No current profile, we delete every entries
                       */
                      if (!profile) {
                        Report.info(
                          `[sw/covers]`,
                          `No current profile set, deleting all covers in cache`
                        )
                        return clearAllCovers()
                      }

                      const requestsNotForCurrentProfile = cacheKeys.filter(
                        (request) => {
                          const { coverId } = getMetadataFromRequest(request)

                          if (!coverId.startsWith(profile)) return true

                          return false
                        }
                      )

                      const cacheKeysNotInDb = cacheKeys.filter((key) => {
                        const { coverId } = getMetadataFromRequest(key)

                        const coverFoundInDb = docs.find(({ _id }) => {
                          const coverIdFromBookId = `${profile}-${_id}`

                          return coverIdFromBookId === coverId
                        })

                        return !coverFoundInDb
                      })

                      if (requestsNotForCurrentProfile.length) {
                        Report.info(
                          `[sw/covers]`,
                          `Removing ${requestsNotForCurrentProfile.length} covers not related to current profile in cache`
                        )
                      }

                      if (cacheKeysNotInDb.length) {
                        Report.info(
                          `[sw/covers]`,
                          `Removing ${cacheKeysNotInDb.length} obsolete covers in cache`
                        )
                      }

                      return from(
                        Promise.all(
                          [
                            ...cacheKeysNotInDb,
                            ...requestsNotForCurrentProfile
                          ].map((key) => cache.delete(key))
                        )
                      )
                    })
                  )
                })
              )
            })
          )
        ),
        finalize(() => {
          db.destroy().catch(console.error)
        })
      )
    )
  )

  const cleanupOutdatedCovers$ = cache$.pipe(
    switchMap((cache) =>
      from(cache.keys()).pipe(
        tap((keys) => {
          const keysToRemoveDueToNewerVersion = keys.filter((item) => {
            if (hasAnotherMoreRecentCoverForThisRequest(item, keys)) {
              return true
            }

            return false
          })

          return from(
            Promise.all(
              keysToRemoveDueToNewerVersion.map((key) => cache.delete(key))
            )
          )
        })
      )
    )
  )

  interval(5 * 60 * 1000 * 2)
    .pipe(
      tap(() => {
        Report.info(`[sw/covers]`, `cleanup process started`)
      }),
      switchMap(() =>
        combineLatest([cleanupForProfile$, cleanupOutdatedCovers$])
      ),
      tap(() => {
        Report.info(`[sw/covers]`, `cleanup process success`)
      }),
      catchError((error) => {
        Report.info(`[sw/covers]`, `cleanup process failed with error`, error)

        console.error(error)

        throw error
      }),
      retry()
    )
    .subscribe()
}
