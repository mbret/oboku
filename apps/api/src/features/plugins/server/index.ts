import { explodeServerResourceId, PLUGIN_SERVER_TYPE } from "@oboku/shared"
import type {
  DataSourcePlugin,
  PluginMetadataParams,
} from "src/features/plugins/types"
import type { WebDAVClient } from "webdav"
import { getConnectorById } from "src/lib/connectors/connectorHelpers"
import {
  getWebdavModule,
  getFileMetadataFromWebdav,
  getFolderMetadataFromWebdav,
  downloadFromWebdav,
} from "../webdav/operations"

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

  const connector = await getConnectorById(db, connectorId, "server")

  if (!connector) {
    throw new Error("Server connector not found")
  }

  const webdav = await getWebdavModule()
  const client = webdav.createClient(
    `http://localhost:${process.env.PORT}/webdav`,
    {
      username: connector.username,
      password: providerCredentials.password,
    },
  )

  const { filePath } = explodeServerResourceId(link.resourceId)

  return { client, filePath }
}

export const dataSource: DataSourcePlugin<"server"> = {
  type: PLUGIN_SERVER_TYPE,
  getLinkCandidatesForItem: async () => {
    throw new Error("server plugin: getLinkCandidatesForItem not implemented")
  },
  getCollectionCandidatesForItem: async () => {
    throw new Error(
      "server plugin: getCollectionCandidatesForItem not implemented",
    )
  },
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
  sync: async () => {
    throw new Error("server plugin: sync not implemented")
  },
}
