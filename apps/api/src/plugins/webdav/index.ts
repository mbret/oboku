/**
 * @see https://github.com/dropbox/dropbox-sdk-js/tree/main/examples/javascript/download
 */
import type { DataSourcePlugin } from "../types.js"
import {
  getDataFromDataSource,
  type WebDAVDataSourceDocType,
  type WebdavConnectorDocType,
} from "@oboku/shared"
import { AuthType, createClient } from "webdav"
import { isRecord } from "../../http/isRecord.js"
import { getUserAddressRequestOptions } from "../../http/userAddressAgents.js"
import { getConnectorById } from "../connectorHelpers.js"
import {
  getFileMetadataFromWebdav,
  getFolderMetadataFromWebdav,
  downloadFromWebdav,
  walkDirectoryContents,
} from "./operations.js"
import { findConnectorCandidates } from "../helpers.js"

const WEBDAV_TYPE = "webdav" satisfies WebDAVDataSourceDocType["type"]

export class WebdavConnectorNotConfiguredError extends Error {
  constructor() {
    super("No WebDAV connector is configured")
  }
}

export class WebdavConnectorNotFoundError extends Error {
  constructor() {
    super("WebDAV connector not found")
  }
}

/** A WebDAV connector, as the user's settings hold it. */
export const findWebdavConnector = async ({
  db,
  connectorId,
}: {
  db: Parameters<typeof getConnectorById>[0]
  connectorId: string | undefined
}) => {
  if (!connectorId) throw new WebdavConnectorNotConfiguredError()

  const connector = await getConnectorById(db, connectorId, "webdav")

  if (!connector) throw new WebdavConnectorNotFoundError()

  return connector
}

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

  const connector = await findWebdavConnector({ db, connectorId })
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

/** The status a server answered with, which WebDAV client errors carry. */
export const toAnsweredStatus = (error: unknown) =>
  isRecord(error) && typeof error.status === "number" ? error.status : null

const UNAUTHORIZED_STATUSES = [401, 403]

/** Whether the server refused the connector's username and password. */
export const isSignInRefused = (error: unknown) => {
  const answeredStatus = toAnsweredStatus(error)

  return (
    answeredStatus !== null && UNAUTHORIZED_STATUSES.includes(answeredStatus)
  )
}

/**
 * Whether the server refused the password itself (401). Unlike
 * `isSignInRefused`, a 403 does not count: once a connector signed in, a 403
 * on one file refuses that file, not the password.
 */
export const isPasswordRefused = (error: unknown) =>
  toAnsweredStatus(error) === 401

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

export const dataSource: DataSourcePlugin<"webdav"> = {
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
    const { providerCredentials, dataSource, db } = options
    const { connectorId, directory } =
      getDataFromDataSource<"webdav">(dataSource) ?? {}

    const rootDirectory = `/${directory ?? ""}`

    if (!connectorId || !providerCredentials?.password) {
      throw new Error("datasource not found or invalid")
    }

    const connector = await findWebdavConnector({ db, connectorId })
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
