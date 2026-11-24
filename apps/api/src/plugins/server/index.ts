import { getDataFromLibrarySync, PLUGIN_SERVER_TYPE } from "@oboku/shared"
import type { SourcePlugin, PluginMetadataParams } from "../types.js"
import { createClient, type WebDAVClient } from "webdav"
import { getConnectorById } from "../connectorHelpers.js"
import {
  getFileMetadataFromWebdav,
  getFolderMetadataFromWebdav,
  downloadFromWebdav,
  walkDirectoryContents,
} from "../webdav/operations.js"
import { findConnectorCandidates } from "../helpers.js"

async function createServerWebdavClient(
  db: Parameters<typeof getConnectorById>[0],
  connectorId: string,
  password: string,
): Promise<WebDAVClient> {
  const connector = await getConnectorById(db, connectorId, "server")

  if (!connector) {
    throw new Error("Server connector not found")
  }

  return createClient(`http://localhost:${process.env.PORT}/webdav`, {
    username: connector.username,
    password,
  })
}

async function resolveClientAndPath(
  params: Pick<
    PluginMetadataParams<"server">,
    "link" | "providerCredentials" | "db"
  >,
): Promise<{ client: WebDAVClient; filePath: string }> {
  const { link, providerCredentials, db } = params
  const connectorId = link.data?.connectorId

  if (!connectorId || !providerCredentials || !db) {
    throw new Error("Server credentials (password) and connector are required")
  }

  const client = await createServerWebdavClient(
    db,
    connectorId,
    providerCredentials.password,
  )

  const filePath = link.data?.filePath

  if (!filePath) {
    throw new Error("Server link is missing filePath")
  }

  return { client, filePath }
}

export const sourcePlugin: SourcePlugin<"server"> = {
  type: PLUGIN_SERVER_TYPE,
  getLinkCandidatesForItem: async (item, ctx) => ({
    links: await findConnectorCandidates(ctx, "link", {
      type: PLUGIN_SERVER_TYPE,
      data: {
        connectorId: item.linkData.connectorId,
        filePath: item.linkData.filePath,
      },
    }),
  }),
  getCollectionCandidatesForItem: async (item, ctx) => ({
    collections: await findConnectorCandidates(ctx, "obokucollection", {
      type: PLUGIN_SERVER_TYPE,
      data: {
        connectorId: item.linkData.connectorId,
        filePath: item.linkData.filePath,
      },
    }),
  }),
  getFolderMetadata: async (params) => {
    const { client, filePath } = await resolveClientAndPath(params)

    return getFolderMetadataFromWebdav(client, filePath)
  },
  getFileMetadata: async (params) => {
    const { client, filePath } = await resolveClientAndPath(params)

    return getFileMetadataFromWebdav(client, filePath)
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
    const { connectorId } = getDataFromLibrarySync<"server">(librarySync) ?? {}

    if (!connectorId || !providerCredentials?.password) {
      throw new Error("library sync not found or invalid")
    }

    const client = await createServerWebdavClient(
      db,
      connectorId,
      providerCredentials.password,
    )

    const sourceItems = await walkDirectoryContents(client, "/", connectorId)

    /**
     * The WebDAV root "/" lists each server source as a top-level folder.
     * These sources are administrative mount points, not user-organized
     * folders, so we flatten them out. This way the folders *within*
     * each source become the first-level items and are treated as
     * collections by the sync logic.
     */
    const items = sourceItems.flatMap((item) =>
      item.type === "folder" && item.items ? item.items : [item],
    )

    return { items }
  },
}
