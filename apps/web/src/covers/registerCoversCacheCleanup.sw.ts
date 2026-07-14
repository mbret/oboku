import {
  switchMap,
  from,
  finalize,
  defer,
  combineLatest,
  lastValueFrom,
} from "rxjs"
import { createSwDatabase } from "../rxdb/db.sw"
import {
  getMetadataFromRequest,
  hasAnotherMoreRecentCoverForThisRequest,
  SW_COVERS_CACHE_KEY,
} from "./helpers.shared"
import { Logger } from "../debug/logger.shared"
import { coalesce } from "../workers/coalesce"

const cache$ = defer(() => from(caches.open(SW_COVERS_CACHE_KEY)))
const database$ = defer(() => from(createSwDatabase()))

const clearAllCovers = async () => {
  const cache = await caches.open(SW_COVERS_CACHE_KEY)
  const cacheKeys = await cache.keys()

  return await Promise.all(cacheKeys.map((key) => cache.delete(key)))
}

const runCleanup = async (profile: string | undefined): Promise<unknown> => {
  const cleanupForProfile$ = database$.pipe(
    switchMap((db) =>
      combineLatest([
        from(db.book.find().exec()),
        from(db.obokucollection.find().exec()),
      ]).pipe(
        switchMap(([bookDocs, collectionDocs]) =>
          cache$.pipe(
            switchMap((cache) =>
              from(cache.keys()).pipe(
                switchMap((cacheKeys) => {
                  /**
                   * No current profile, we delete every entries
                   */
                  if (!profile) {
                    Logger.info(
                      `[sw/covers]`,
                      `No current profile set, deleting all covers in cache`,
                    )
                    return clearAllCovers()
                  }

                  const cacheKeysNotInDb = cacheKeys.filter((key) => {
                    const { coverId } = getMetadataFromRequest(key)

                    const coverFoundInDb =
                      bookDocs.some(({ _id }) => _id === coverId) ||
                      collectionDocs.some(({ _id }) => _id === coverId)

                    return !coverFoundInDb
                  })

                  if (cacheKeysNotInDb.length) {
                    Logger.info(
                      `[sw/covers]`,
                      `Removing ${cacheKeysNotInDb.length} obsolete covers in cache`,
                    )
                  }

                  return from(
                    Promise.all(
                      cacheKeysNotInDb.map((key) => cache.delete(key)),
                    ),
                  )
                }),
              ),
            ),
          ),
        ),
        finalize(() => {
          db.close().catch(console.error)
        }),
      ),
    ),
  )

  const cleanupOutdatedCovers$ = cache$.pipe(
    switchMap((cache) =>
      from(cache.keys()).pipe(
        switchMap((keys) => {
          const keysToRemoveDueToNewerVersion = keys.filter((item) =>
            hasAnotherMoreRecentCoverForThisRequest(item, keys),
          )

          return from(
            Promise.all(
              keysToRemoveDueToNewerVersion.map((key) => cache.delete(key)),
            ),
          )
        }),
      ),
    ),
  )

  Logger.info(`[sw/covers]`, `cleanup process started`)

  const result = await lastValueFrom(
    combineLatest([cleanupForProfile$, cleanupOutdatedCovers$]),
  )

  Logger.info(`[sw/covers]`, `cleanup process success`)

  return result
}

export const runCoversCacheCleanup = coalesce(runCleanup)
