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
  getLinkCandidatesForItem: async ({ linkData }, ctx) => ({
    links:
      "entryId" in linkData
        ? await findConnectorCandidates(ctx, "link", {
            type: PLUGIN_OPDS_TYPE,
            data: {
              connectorId: linkData.connectorId,
              entryId: linkData.entryId,
            },
          })
        : [],
  }),
  getCollectionCandidatesForItem: async ({ linkData }, ctx) => ({
    collections:
      "feedUrl" in linkData
        ? await findConnectorCandidates(ctx, "obokucollection", {
            type: PLUGIN_OPDS_TYPE,
            data: {
              connectorId: linkData.connectorId,
              feedUrl: linkData.feedUrl,
            },
          })
        : [],
  }),
  /**
   * `<updated>` describes the catalog's record rather than the file's bytes,
   * so it cannot tell the metadata cache whether the file changed.
   */
  getFileMetadata: async ({ link: { data } }) => {
    const acquisition = "acquisition" in data ? data.acquisition : undefined

    return {
      name: data.title,
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
  download: async ({ data }, providerCredentials, db) => {
    if (!("acquisition" in data)) {
      throw new Error("OPDS link has no acquisition URL")
    }

    const connector = await resolveConnector({
      connectorId: data.connectorId,
      password: providerCredentials?.password,
      db,
    })
    const { stream } = await getFromCatalog(
      connector,
      new URL(data.acquisition.href),
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
