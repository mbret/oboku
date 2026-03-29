import type { MigrationStrategies, RxCollection, RxJsonSchema } from "rxdb"
import type { Database } from "../databases.shared"
import { getReplicationProperties } from "../replication/getReplicationProperties"
import { generateId } from "./utils"
import type {
  SettingsConnectorDocType,
  SettingsConnectorType,
  SettingsDocType,
} from "@oboku/shared"

type SettingsCollectionMethods = {
  postConnector: (
    json: Omit<SettingsConnectorDocType, "id">,
  ) => Promise<SettingsDocType>
  deleteConnector: (id: string) => Promise<SettingsDocType>
  patchConnector: (
    id: string,
    json: Partial<Omit<SettingsConnectorDocType, "id">>,
  ) => Promise<SettingsDocType>
  getConnector: (id: string) => Promise<SettingsConnectorDocType | null>
}

export type SettingsCollection = RxCollection<
  SettingsDocType,
  // biome-ignore lint/complexity/noBannedTypes: TODO
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
    connectors: {
      type: "array",
      uniqueItems: true,
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: {
            type: "string",
            enum: ["webdav", "synology-drive", "server"],
          },
          url: { type: "string" },
          username: { type: "string" },
          passwordAsSecretId: { type: "string" },
          allowSelfSigned: { type: "boolean" },
        },
        required: ["id", "type", "username", "passwordAsSecretId"],
      },
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
    readerGlobalFontScale: { type: ["number", "null"] },
    readerMobileFontScale: { type: ["number", "null"] },
    readerTabletFontScale: { type: ["number", "null"] },
    readerDesktopFontScale: { type: ["number", "null"] },
    ...getReplicationProperties(`settings`),
  },
}

export const isConnectorOfType = <T extends SettingsConnectorType>(
  connector: SettingsConnectorDocType,
  type: T,
): connector is Extract<SettingsConnectorDocType, { type: T }> =>
  connector.type === type

export const settingsSchemaMigrationStrategies: MigrationStrategies = {}

export const settingsCollectionMethods: SettingsCollectionMethods = {
  postConnector: async function (this: SettingsCollection, json) {
    const settings = await this.findOne("settings").exec()

    if (!settings) {
      throw new Error("Settings not found")
    }

    return settings.incrementalModify((doc) => {
      if (!doc.connectors) {
        doc.connectors = []
      }

      doc.connectors?.push({
        id: generateId(),
        ...json,
      } as SettingsConnectorDocType)

      return doc
    })
  },
  deleteConnector: async function (this: SettingsCollection, id) {
    const settings = await this.findOne("settings").exec()

    if (!settings) {
      throw new Error("Settings not found")
    }

    return settings.incrementalModify((doc) => {
      return {
        ...doc,
        connectors: doc.connectors?.filter((connector) => connector.id !== id),
      }
    })
  },
  patchConnector: async function (this: SettingsCollection, id, json) {
    const settings = await this.findOne("settings").exec()

    if (!settings) {
      throw new Error("Settings not found")
    }

    return settings.incrementalModify((doc) => {
      doc.connectors = doc.connectors?.map((connector) => {
        if (connector.id !== id) {
          return connector
        }

        return Object.assign({}, connector, json)
      })

      return doc
    })
  },
  getConnector: async function (this: SettingsCollection, id) {
    const settings = await this.findOne("settings").exec()

    if (!settings) {
      throw new Error("Settings not found")
    }

    const connector = settings.connectors?.find(
      (connector) => connector.id === id,
    )

    return connector ?? null
  },
}

export const initializeSettings = async (db: Database) => {
  const settings = await db.settings.findOne().exec()

  if (!settings) {
    await db.settings.insert({
      _id: "settings",
    })

    return
  }
}
