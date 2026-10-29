import type { WebdavConnectorDocType } from "@oboku/shared"
import { createRxDatabase } from "rxdb"
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie"
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv"
import { firstValueFrom } from "rxjs"
import { describe, expect, it, onTestFinished } from "vitest"
import { createDatabase } from "../databases.shared"
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

const openDatabase = async (name: string) => {
  const database = await firstValueFrom(createDatabase({ name }))

  onTestFinished(async function removeDatabase() {
    await database.remove()
  })

  return database
}

describe("settings collection", () => {
  it("keeps the connectors stored with the schema before OPDS", async () => {
    const name = `settings-${crypto.randomUUID()}`
    await storeSettingsOfSchemaVersionZero(name)

    const database = await openDatabase(name)
    const settings = await database.settings.findOne("settings").exec()

    expect(settings?.connectors).toEqual([webdavConnector])
  })

  it("stores an OPDS connector", async () => {
    const database = await openDatabase(`settings-${crypto.randomUUID()}`)

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
