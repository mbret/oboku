/**
 * @see https://github.com/dropbox/dropbox-sdk-js/tree/main/examples/javascript/download
 */
import type { SourcePlugin } from "../types.js"
import {
  getDataFromLibrarySync,
  type WebDAVLibrarySyncDocType,
  type WebdavConnectorDocType,
} from "@oboku/shared"
import { AuthType, createClient } from "webdav"
import { isRecord } from "../../http/isRecord.js"
import { getUserAddressRequestOptions } from "../../http/userAddressAgents.js"
import { findConnector, type getConnectorById } from "../connectorHelpers.js"
import {
  getFileMetadataFromWebdav,
  getFolderMetadataFromWebdav,
  downloadFromWebdav,
  walkDirectoryContents,
} from "./operations.js"
import { findConnectorCandidates } from "../helpers.js"

const WEBDAV_TYPE = "webdav" satisfies WebDAVLibrarySyncDocType["type"]

async function resolveClientAndPath(params: {
  link: { data: { connectorId?: string; filePath?: string } }
  providerCredentials?: { password: string } | null
  db?: Parameters<typeof getConnectorById>[0]
}) {
  const { link, providerCredentials, db } = params
  const connectorId = link.data.connectorId
  const filePath = link.data.filePath

  if (!connectorId || !filePath || !providerCredentials || !db) {
    throw new Error(
      "WebDAV credentials (password), connector, and filePath are required",
    )
  }

  const connector = await findConnector({ db, connectorId, type: WEBDAV_TYPE })
  const client = createWebdavClient({
    ...connector,
    password: providerCredentials.password,
  })

  return { client, filePath }
}

export const createWebdavClient = (connector: {
  allowSelfSigned?: boolean
  password: string
  url: string
  username: string
}) =>
  createClient(connector.url, {
    username: connector.username,
    password: connector.password,
    authType: AuthType.Auto,
    ...getUserAddressRequestOptions({
      allowSelfSigned: connector.allowSelfSigned,
    }),
  })

export const isWebdavConnector = (
  value: unknown,
): value is WebdavConnectorDocType =>
  isRecord(value) &&
  value.type === WEBDAV_TYPE &&
  typeof value.id === "string" &&
  typeof value.url === "string" &&
  typeof value.username === "string" &&
  typeof value.passwordAsSecretId === "string" &&
  (value.allowSelfSigned === undefined ||
    typeof value.allowSelfSigned === "boolean") &&
  (value.proxyThroughServer === undefined ||
    typeof value.proxyThroughServer === "boolean")

export const listWebdavDirectory = ({
  path,
  signal,
  ...connection
}: Parameters<typeof createWebdavClient>[0] & {
  path: string
  signal: AbortSignal
}) => createWebdavClient(connection).getDirectoryContents(path, { signal })

/** Lists the connector's root, as the app's connection test does. */
export const signInToWebdav = async ({
  connector,
  password,
  signal,
}: {
  connector: WebdavConnectorDocType
  password: string
  signal: AbortSignal
}) => {
  await listWebdavDirectory({ ...connector, password, path: "/", signal })
}

export const sourcePlugin: SourcePlugin<"webdav"> = {
  type: WEBDAV_TYPE,
  getLinkCandidatesForItem: async (item, ctx) => ({
    links: await findConnectorCandidates(ctx, "link", {
      type: WEBDAV_TYPE,
      data: {
        connectorId: item.linkData.connectorId,
        filePath: item.linkData.filePath,
      },
    }),
  }),
  getCollectionCandidatesForItem: async (item, ctx) => ({
    collections: await findConnectorCandidates(ctx, "obokucollection", {
      type: WEBDAV_TYPE,
      data: {
        connectorId: item.linkData.connectorId,
        filePath: item.linkData.filePath,
      },
    }),
  }),
  getFileMetadata: async ({ link, providerCredentials, db }) => {
    const { client, filePath } = await resolveClientAndPath({
      link,
      providerCredentials,
      db,
    })

    return getFileMetadataFromWebdav(client, filePath)
  },
  getFolderMetadata: async ({ link, providerCredentials, db }) => {
    const { client, filePath } = await resolveClientAndPath({
      link,
      providerCredentials,
      db,
    })

    return getFolderMetadataFromWebdav(client, filePath)
  },
  download: async (link, providerCredentials, db) => {
    const { client, filePath } = await resolveClientAndPath({
      link,
      providerCredentials,
      db,
    })

    return downloadFromWebdav(client, filePath)
  },
  sync: async (options) => {
    const { providerCredentials, librarySync, db } = options
    const { connectorId, directory } =
      getDataFromLibrarySync<"webdav">(librarySync) ?? {}

    const rootDirectory = `/${directory ?? ""}`

    if (!connectorId || !providerCredentials?.password) {
      throw new Error("library sync not found or invalid")
    }

    const connector = await findConnector({
      db,
      connectorId,
      type: WEBDAV_TYPE,
    })
    const client = await createWebdavClient({
      ...connector,
      password: providerCredentials.password,
    })

    const items = await walkDirectoryContents(
      client,
      rootDirectory,
      connectorId,
    )

    return {
      name: rootDirectory,
      items,
    }
  },
}
