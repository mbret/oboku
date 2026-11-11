import { beforeEach, describe, expect, it } from "vitest"
import { dexieDb } from "../rxdb/dexie"
import { readWebConfigCache, saveWebConfigCache } from "./configCache"

describe("readWebConfigCache", () => {
  beforeEach(async () => {
    await dexieDb.keyValue.clear()
  })

  it("reads a config cached by a release that sent fewer fields", async () => {
    const configBeforeGoogleConnection = {
      MICROSOFT_APPLICATION_AUTHORITY:
        "https://login.microsoftonline.com/common",
      FEATURE_SERVER_SYNC_ENABLED: true,
      SHOW_DISABLED_PLUGINS: false,
    }

    await saveWebConfigCache(configBeforeGoogleConnection)

    await expect(readWebConfigCache()).resolves.toEqual(
      configBeforeGoogleConnection,
    )
  })
})
