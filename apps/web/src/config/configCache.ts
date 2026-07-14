import {
  getWebConfigResponseSchema,
  type GetWebConfigResponse,
} from "@oboku/shared"
import { dexieDb } from "../rxdb/dexie"
import { Logger } from "../debug/logger.shared"

const CONFIG_CACHE_KEY = "config.webConfig"

/**
 * Version for the offline web-config seed. Bump only when the cached server
 * payload changes in a way `getWebConfigResponseSchema` cannot reject on its
 * own. Deliberately independent of the app version and the react-query snapshot
 * buster (see queries/persister): a normal release busts that snapshot, so
 * keeping the config here — under its own version — is what lets a user boot
 * offline right after an update instead of being stranded on the splash screen.
 */
const CONFIG_CACHE_VERSION = 1

export type CachedWebConfig = {
  version: number
  server: GetWebConfigResponse
}

const isCachedWebConfig = (value: unknown): value is CachedWebConfig =>
  typeof value === "object" &&
  value !== null &&
  "version" in value &&
  value.version === CONFIG_CACHE_VERSION &&
  "server" in value

export const saveWebConfigCache = async (server: GetWebConfigResponse) => {
  try {
    await dexieDb.keyValue.put({
      key: CONFIG_CACHE_KEY,
      value: {
        version: CONFIG_CACHE_VERSION,
        server,
      },
    })
  } catch (error) {
    Logger.error("Failed to cache web config for offline boot", error)
  }
}

export const readWebConfigCache = async (): Promise<
  GetWebConfigResponse | undefined
> => {
  try {
    const entry = await dexieDb.keyValue.get(CONFIG_CACHE_KEY)

    if (!isCachedWebConfig(entry?.value)) return undefined

    const result = getWebConfigResponseSchema.safeParse(entry.value.server)

    return result.success ? result.data : undefined
  } catch (error) {
    Logger.error("Failed to read cached web config", error)

    return undefined
  }
}
