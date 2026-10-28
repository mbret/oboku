import { getDataFromDataSource, PLUGIN_OPDS_TYPE } from "@oboku/shared"
import type createNano from "nano"
import { getConnectorById } from "../connectorHelpers.js"
import { findConnectorCandidates } from "../helpers.js"
import { type DataSourcePlugin, MODIFIED_AT_UNSUPPORTED } from "../types.js"
import { crawlOpdsFeed, getFromCatalog, type OpdsConnector } from "./feed.js"

async function resolveConnector({
  connectorId,
  password,
  db,
}: {
  connectorId: string | undefined
  password: string | undefined
  db: createNano.DocumentScope<unknown> | undefined
}): Promise<OpdsConnector> {
  if (!connectorId || !password || !db) {
    throw new Error("OPDS credentials (password) and connector are required")
  }

  const connector = await getConnectorById(db, connectorId, "opds")

  if (!connector) {
    throw new Error("OPDS connector not found")
  }

  const { passwordAsSecretId: _, ...connectorFields } = connector

  return { ...connectorFields, password }
}

export const dataSource: DataSourcePlugin<"opds"> = {
  type: PLUGIN_OPDS_TYPE,
  getLinkCandidatesForItem: async (item, ctx) => ({
    links: await findConnectorCandidates(ctx, "link", {
      type: PLUGIN_OPDS_TYPE,
      data: {
        connectorId: item.linkData.connectorId,
        entryId: item.linkData.entryId,
      },
    }),
  }),
  getCollectionCandidatesForItem: async (item, ctx) => ({
    collections: await findConnectorCandidates(ctx, "obokucollection", {
      type: PLUGIN_OPDS_TYPE,
      data: {
        connectorId: item.linkData.connectorId,
        entryId: item.linkData.entryId,
      },
    }),
  }),
  /**
   * `<updated>` describes the catalog's record rather than the file's bytes,
   * so it cannot tell the metadata cache whether the file changed.
   */
  getFileMetadata: async ({ link }) => {
    const { title, acquisition } = link.data

    return {
      name: title,
      canDownload: acquisition !== undefined,
      contentType: acquisition?.type,
      modifiedAt: MODIFIED_AT_UNSUPPORTED,
      bookMetadata:
        acquisition?.length === undefined
          ? undefined
          : { size: acquisition.length.toString() },
    }
  },
  getFolderMetadata: async ({ link }) => ({ name: link.data.title }),
  download: async (link, providerCredentials, db) => {
    const { acquisition } = link.data

    if (!acquisition) {
      throw new Error("OPDS link has no acquisition URL")
    }

    const connector = await resolveConnector({
      connectorId: link.data.connectorId,
      password: providerCredentials?.password,
      db,
    })
    const { stream } = await getFromCatalog(
      connector,
      new URL(acquisition.href),
    )

    return { stream }
  },
  sync: async ({ dataSource, db, providerCredentials }) => {
    const { connectorId, feedUrl } =
      getDataFromDataSource<"opds">(dataSource) ?? {}

    if (!feedUrl || !URL.canParse(feedUrl)) {
      throw new Error("datasource not found or invalid")
    }

    const connector = await resolveConnector({
      connectorId,
      password: providerCredentials?.password,
      db,
    })

    return { items: await crawlOpdsFeed(connector, new URL(feedUrl)) }
  },
}
