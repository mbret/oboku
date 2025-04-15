import type { MigrationStrategies, RxCollection, RxJsonSchema } from "rxdb"
import type { Database } from "../databases"
import { getReplicationProperties } from "../replication/getReplicationProperties"
import { generateId } from "./utils"

export type SettingsDocType = {
  _id: "settings"
  masterEncryptionKey?: {
    salt: string
    iv: string
    data: string
  } | null
  webdavConnectors?: {
    id: string
    url: string
    username: string
    passwordAsSecretId: string
  }[]
}

type SettingsCollectionMethods = {
  postWebdavConnector: (
    json: Omit<NonNullable<SettingsDocType["webdavConnectors"]>[number], "id">,
  ) => Promise<SettingsDocType>
  deleteWebdavConnector: (id: string) => Promise<SettingsDocType>
  patchWebdavConnector: (
    id: string,
    json: Partial<NonNullable<SettingsDocType["webdavConnectors"]>[number]>,
  ) => Promise<SettingsDocType>
}

export type SettingsCollection = RxCollection<
  SettingsDocType,
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  {},
  SettingsCollectionMethods
>

export const settingsSchema: RxJsonSchema<
  SettingsDocType & {
    // @deprecated
    contentPassword?: string | null
  }
> = {
  version: 0,
  type: "object",
  primaryKey: `_id`,
  properties: {
    _id: { type: "string", final: true, maxLength: 100 },
    contentPassword: { type: ["string", "null"] },
    masterEncryptionKey: {
      type: ["object", "null"],
      properties: {
        salt: { type: "string" },
        iv: { type: "string" },
        data: { type: "string" },
      },
      required: ["salt", "iv", "data"],
    },
    webdavConnectors: {
      type: "array",
      uniqueItems: true,
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          url: { type: "string" },
          username: { type: "string" },
          passwordAsSecretId: { type: "string" },
        },
        required: ["url", "username", "passwordAsSecretId"],
      },
    },
    ...getReplicationProperties(`settings`),
  },
}

export const settingsSchemaMigrationStrategies: MigrationStrategies = {}

export const settingsCollectionMethods: SettingsCollectionMethods = {
  postWebdavConnector: async function (this: SettingsCollection, json) {
    const settings = await this.findOne("settings").exec()

    if (!settings) {
      throw new Error("Settings not found")
    }

    return settings.incrementalModify((doc) => {
      if (!doc.webdavConnectors) {
        doc.webdavConnectors = []
      }

      doc.webdavConnectors?.push({
        id: generateId(),
        ...json,
      })

      return doc
    })
  },
  deleteWebdavConnector: async function (this: SettingsCollection, id) {
    const settings = await this.findOne("settings").exec()

    if (!settings) {
      throw new Error("Settings not found")
    }

    return settings.incrementalModify((doc) => {
      return {
        ...doc,
        webdavConnectors: doc.webdavConnectors?.filter(
          (connector) => connector.id !== id,
        ),
      }
    })
  },
  patchWebdavConnector: async function (this: SettingsCollection, id, json) {
    const settings = await this.findOne("settings").exec()

    if (!settings) {
      throw new Error("Settings not found")
    }

    return settings.incrementalModify((doc) => {
      return {
        ...doc,
        webdavConnectors: doc.webdavConnectors?.map((connector) => {
          if (connector.id === id) {
            return {
              ...connector,
              ...json,
            }
          }

          return connector
        }),
      }
    })
  },
}

export const initializeSettings = async (db: Database) => {
  const settings = await db.settings.findOne().exec()

  if (!settings) {
    await db.settings.insert({
      _id: "settings",
    })
  }
}
