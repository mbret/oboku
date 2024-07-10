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
import { WEB_OBOKU_PROFILE_REQUEST_MESSAGE_DATA } from "../workers/types"
import { COVERS_CACHE_KEY, REPORT_NAMESPACE } from "./constants.sw"
import {
  getMetadataFromRequest,
  hasAnotherMoreRecentCoverForThisRequest
} from "./helpers.shared"
import { Report } from "../debug/report.shared"

declare const self: ServiceWorkerGlobalScope

const cache$ = defer(() => from(caches.open(COVERS_CACHE_KEY)))
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
                          REPORT_NAMESPACE,
                          `No current profile set, deleting all covers in cache`
                        )
                        return clearAllCovers()
                      }

                      const cacheKeysNotInDb = cacheKeys.filter((key) => {
                        const { coverId } = getMetadataFromRequest(key)

                        const coverFoundInDb = docs.find(({ _id }) => {
                          const coverIdFromBookId = `${profile}-${_id}`

                          return coverIdFromBookId === coverId
                        })

                        return !coverFoundInDb
                      })

                      if (cacheKeysNotInDb.length) {
                        Report.info(
                          REPORT_NAMESPACE,
                          `Removing ${cacheKeysNotInDb.length} obsolete covers in cache`
                        )
                      }

                      return from(
                        Promise.all(
                          cacheKeysNotInDb.map((key) => cache.delete(key))
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

  interval(5 * 60 * 1000)
    .pipe(
      tap(() => {
        Report.info(REPORT_NAMESPACE, `cleanup process started`)
      }),
      switchMap(() =>
        combineLatest([cleanupForProfile$, cleanupOutdatedCovers$])
      ),
      tap(() => {
        Report.info(REPORT_NAMESPACE, `cleanup process success`)
      }),
      catchError((error) => {
        Report.info(
          REPORT_NAMESPACE,
          `cleanup process failed with error`,
          error
        )

        console.error(error)

        throw error
      }),
      retry()
    )
    .subscribe()
}
