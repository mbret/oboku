import {
  explodeSynologyDriveResourceId,
  isCollectionOfType,
  PLUGIN_SYNOLOGY_DRIVE_TYPE,
} from "@oboku/shared"
import { Logger } from "@nestjs/common"
import type { DataSourcePlugin } from "src/lib/plugins/types"
import { find } from "src/lib/couch/dbHelpers"
import { getConnectorById } from "../../connectors/connectorHelpers"
import {
  downloadSynologyDriveStream,
  getSynchronizeAbleDataSourceFromItems,
  getSynologyDriveItemMetadata,
  getSynologyDriveSession,
} from "./client"
import { getDataSourceData } from "../helpers"

const logger = new Logger("SynologyDrivePlugin")

export const dataSource: DataSourcePlugin<"synology-drive"> = {
  type: PLUGIN_SYNOLOGY_DRIVE_TYPE,
  /**
   * Finds persisted link candidates using the exact stored link identity.
   *
   * Why this is intentionally strict:
   * - A datasource is only a sync scope, not an ownership boundary.
   * - The same Synology Drive item may be reachable through multiple
   *   datasources/connectors with different valid credentials.
   * - We should not collapse or reuse those paths just because they target the
   *   same normalized server.
   *
   * Matching rule:
   * - same provider type
   * - same resourceId
   * - same connectorId
   *
   * This keeps sync non-destructive. "Same normalized server" is broader than
   * the persisted identity we want to preserve.
   */
  getLinkCandidatesForItem: async (item, ctx) => {
    const connectorId = item.linkData.connectorId
    if (!connectorId) {
      return { links: [] }
    }

    const links = await find(ctx.db, "link", {
      selector: {
        type: PLUGIN_SYNOLOGY_DRIVE_TYPE,
        resourceId: item.resourceId,
        data: { connectorId },
      },
    })

    const datasourceData = ctx.dataSource

    const datasourceConnectorId =
      datasourceData.type === "synology-drive"
        ? datasourceData.data_v2?.connectorId
        : null

    return {
      links: links.map((link) => {
        const linkConnectorId =
          link.type === "synology-drive" ? link.data?.connectorId : null

        return {
          ...link,
          isUsingSameProviderCredentials:
            linkConnectorId === datasourceConnectorId,
        }
      }),
    }
  },
  /**
   * Same identity rule as getLinkCandidatesForItem: collections are only
   * considered the same persisted resource when both resourceId and connectorId
   * match exactly.
   */
  getCollectionCandidatesForItem: async (item, ctx) => {
    const connectorId = item.linkData.connectorId
    if (!connectorId) {
      return { collections: [] }
    }
    const collections = await find(ctx.db, "obokucollection", {
      selector: {
        linkType: PLUGIN_SYNOLOGY_DRIVE_TYPE,
        linkResourceId: item.resourceId,
        linkData: { connectorId },
      },
    })
    const datasourceData = ctx.dataSource
    const datasourceConnectorId =
      datasourceData.type === "synology-drive"
        ? datasourceData.data_v2?.connectorId
        : undefined
    return {
      collections: collections.map((c) => {
        const collectionConnectorId = isCollectionOfType(
          c,
          PLUGIN_SYNOLOGY_DRIVE_TYPE,
        )
          ? (c.linkData?.connectorId ?? null)
          : null

        return {
          ...c,
          isUsingSameProviderCredentials:
            collectionConnectorId === datasourceConnectorId,
        }
      }),
    }
  },
  getFileMetadata: async ({ link, providerCredentials, db }) => {
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
    const { fileId } = explodeSynologyDriveResourceId(link.resourceId)
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
      modifiedAt: metadata.modifiedAt,
      name: metadata.name,
    }
  },
  getFolderMetadata: async ({ link, providerCredentials, db }) => {
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
    const { fileId } = explodeSynologyDriveResourceId(link.resourceId)
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
    const { fileId } = explodeSynologyDriveResourceId(link.resourceId)

    return downloadSynologyDriveStream({
      fileId,
      session,
    })
  },
  sync: async ({ dataSourceId, db, providerCredentials }) => {
    const { connectorId, items = [] } =
      (await getDataSourceData<"synology-drive">({
        dataSourceId,
        db,
      })) ?? {}

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
