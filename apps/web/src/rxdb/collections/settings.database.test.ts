import type { WebdavConnectorDocType } from "@oboku/shared"
import { createRxDatabase } from "rxdb"
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie"
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv"
import { describe, expect, it } from "vitest"
import { openTestDatabase } from "../databases.fixture"
import { settingsSchema } from "./settings"

const webdavConnector: WebdavConnectorDocType = {
  id: "webdav-connector",
  type: "webdav",
  url: "https://nas.example.com/dav",
  username: "reader",
  passwordAsSecretId: "password-secret",
}

const storeSettingsOfSchemaVersionZero = async (name: string) => {
  const database = await createRxDatabase({
    name,
    storage: wrappedValidateAjvStorage({ storage: getRxStorageDexie() }),
  })

  const { settings } = await database.addCollections({
    settings: { schema: { ...settingsSchema, version: 0 } },
  })

  await settings.insert({ _id: "settings", connectors: [webdavConnector] })
  await database.close()
}

describe("settings collection", () => {
  it("keeps the connectors stored with the schema before OPDS", async () => {
    const name = `settings-${crypto.randomUUID()}`
    await storeSettingsOfSchemaVersionZero(name)

    const database = await openTestDatabase(name)
    const settings = await database.settings.findOne("settings").exec()

    expect(settings?.connectors).toEqual([webdavConnector])
  })

  it("stores an OPDS connector", async () => {
    const database = await openTestDatabase()

    const settings = await database.settings.postConnector({
      type: "opds",
      url: "https://catalog.example.com",
      username: "reader",
      passwordAsSecretId: "password-secret",
    })

    expect(settings.connectors).toMatchObject([
      { type: "opds", url: "https://catalog.example.com" },
    ])
  })
})
