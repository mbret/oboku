import {
  switchMap,
  from,
  finalize,
  defer,
  combineLatest,
  lastValueFrom,
} from "rxjs"
import { createSwDatabase } from "../rxdb/db.sw"
import { getMetadataFromRequest, SW_COVERS_CACHE_KEY } from "./helpers.shared"
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

                  const idsInDb = new Set<string>()
                  for (const { _id } of bookDocs) idsInDb.add(_id)
                  for (const { _id } of collectionDocs) idsInDb.add(_id)

                  const cacheKeysNotInDb = cacheKeys.filter((key) => {
                    const { coverId } = getMetadataFromRequest(key)

                    return !idsInDb.has(coverId)
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
          const latestTimeByCoverId = new Map<string, number>()
          const keyMetadata = keys.map((request) => {
            const { coverId, coverTimeCached } = getMetadataFromRequest(request)
            const latestCoverTime = latestTimeByCoverId.get(coverId)

            if (
              latestCoverTime === undefined ||
              coverTimeCached > latestCoverTime
            ) {
              latestTimeByCoverId.set(coverId, coverTimeCached)
            }

            return { request, coverId, coverTimeCached }
          })

          const keysToRemoveDueToNewerVersion = keyMetadata
            .filter(
              ({ coverId, coverTimeCached }) =>
                coverTimeCached < (latestTimeByCoverId.get(coverId) ?? 0),
            )
            .map(({ request }) => request)

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
