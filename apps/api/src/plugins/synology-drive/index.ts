import {
  getDataFromDataSource,
  type LinkWithCredentials,
  PLUGIN_SYNOLOGY_DRIVE_TYPE,
  type ProviderApiCredentials,
} from "@oboku/shared"
import { Logger } from "@nestjs/common"
import type createNano from "nano"
import { type DataSourcePlugin, MODIFIED_AT_UNSUPPORTED } from "../types.js"
import { findConnectorCandidates } from "../helpers.js"
import { getConnectorById } from "../../lib/connectors/connectorHelpers.js"
import {
  downloadSynologyDriveStream,
  getSynchronizeAbleDataSourceFromItems,
  getSynologyDriveItemMetadata,
  getSynologyDriveSession,
} from "./client.js"

const logger = new Logger("SynologyDrivePlugin")

const openSynologyDriveSessionForLink = async ({
  link,
  providerCredentials,
  db,
}: {
  link: LinkWithCredentials<"synology-drive">
  providerCredentials: ProviderApiCredentials<"synology-drive">
  db?: createNano.DocumentScope<unknown>
}) => {
  const connectorId = link.data?.connectorId
  if (!connectorId || !providerCredentials || !db) {
    throw new Error(
      "Synology Drive credentials (password) and connector are required",
    )
  }
  const connector = await getConnectorById(db, connectorId, "synology-drive")
  if (!connector) {
    throw new Error("Synology Drive connector not found")
  }
  const session = await getSynologyDriveSession({
    connector: {
      allowSelfSigned: connector.allowSelfSigned,
      url: connector.url,
      username: connector.username,
    },
    providerCredentials,
  })

  return { session, fileId: link.data.fileId }
}

export const dataSource: DataSourcePlugin<"synology-drive"> = {
  type: PLUGIN_SYNOLOGY_DRIVE_TYPE,
  getLinkCandidatesForItem: async (item, ctx) => ({
    links: await findConnectorCandidates(ctx, "link", {
      type: PLUGIN_SYNOLOGY_DRIVE_TYPE,
      data: {
        connectorId: item.linkData.connectorId,
        fileId: item.linkData.fileId,
      },
    }),
  }),
  getCollectionCandidatesForItem: async (item, ctx) => ({
    collections: await findConnectorCandidates(ctx, "obokucollection", {
      type: PLUGIN_SYNOLOGY_DRIVE_TYPE,
      data: {
        connectorId: item.linkData.connectorId,
        fileId: item.linkData.fileId,
      },
    }),
  }),
  getFileMetadata: async ({ link, providerCredentials, db }) => {
    const { session, fileId } = await openSynologyDriveSessionForLink({
      link,
      providerCredentials,
      db,
    })
    const metadata = await getSynologyDriveItemMetadata({
      fileId,
      session,
    })

    return {
      bookMetadata: {
        size: metadata.size?.toString(),
      },
      canDownload: metadata.type === "file",
      contentType: metadata.contentType,
      modifiedAt: metadata.modifiedAt ?? MODIFIED_AT_UNSUPPORTED,
      name: metadata.name,
    }
  },
  getFolderMetadata: async ({ link, providerCredentials, db }) => {
    const { session, fileId } = await openSynologyDriveSessionForLink({
      link,
      providerCredentials,
      db,
    })
    const metadata = await getSynologyDriveItemMetadata({
      fileId,
      session,
    })

    return {
      modifiedAt: metadata.modifiedAt,
      name: metadata.name,
    }
  },
  download: async (link, providerCredentials, db) => {
    const { session, fileId } = await openSynologyDriveSessionForLink({
      link,
      providerCredentials,
      db,
    })

    return downloadSynologyDriveStream({
      fileId,
      session,
    })
  },
  sync: async ({ dataSource, dataSourceId, db, providerCredentials }) => {
    const { connectorId, items = [] } =
      getDataFromDataSource<"synology-drive">(dataSource) ?? {}

    if (!connectorId || items.length === 0 || !providerCredentials) {
      throw new Error("datasource not found or invalid")
    }

    logger.log(
      `Starting Synology Drive sync for datasource ${dataSourceId} with ${items.length} selected item(s)`,
    )

    const connector = await getConnectorById(db, connectorId, "synology-drive")
    if (!connector) {
      throw new Error("Synology Drive connector not found")
    }

    const session = await getSynologyDriveSession({
      connector: {
        allowSelfSigned: connector.allowSelfSigned,
        url: connector.url,
        username: connector.username,
      },
      providerCredentials,
    })

    logger.log("Synology Drive session created")

    return getSynchronizeAbleDataSourceFromItems({
      connectorId,
      items,
      session,
    })
  },
}
