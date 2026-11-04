import {
  getDataFromDataSource,
  isOpdsBookLinkData,
  isOpdsFolderLinkData,
  type OpdsBookLinkData,
  type OpdsFolderLinkData,
  type OpdsLinkData,
  PLUGIN_OPDS_TYPE,
} from "@oboku/shared"
import type createNano from "nano"
import { getConnectorById } from "../connectorHelpers.js"
import { findConnectorCandidates } from "../helpers.js"
import { type DataSourcePlugin, MODIFIED_AT_UNSUPPORTED } from "../types.js"
import { getFromCatalog, type OpdsConnector } from "./client.js"
import { crawlOpdsFeed } from "./feed.js"

const toBookLinkData = (linkData: OpdsLinkData): OpdsBookLinkData => {
  if (!isOpdsBookLinkData(linkData)) {
    throw new Error("Not the link data of an OPDS book")
  }

  return linkData
}

const toFolderLinkData = (linkData: OpdsLinkData): OpdsFolderLinkData => {
  if (!isOpdsFolderLinkData(linkData)) {
    throw new Error("Not the link data of an OPDS folder")
  }

  return linkData
}

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
  getLinkCandidatesForItem: async ({ linkData }, ctx) => {
    const { connectorId, entryId } = toBookLinkData(linkData)

    return {
      links: await findConnectorCandidates(ctx, "link", {
        type: PLUGIN_OPDS_TYPE,
        data: { connectorId, entryId },
      }),
    }
  },
  getCollectionCandidatesForItem: async ({ linkData }, ctx) => {
    const { connectorId, feedUrl } = toFolderLinkData(linkData)

    return {
      collections: await findConnectorCandidates(ctx, "obokucollection", {
        type: PLUGIN_OPDS_TYPE,
        data: { connectorId, feedUrl },
      }),
    }
  },
  getFileMetadata: async ({ link }) => {
    const { title, acquisition } = toBookLinkData(link.data)

    return {
      name: title,
      canDownload: true,
      contentType: acquisition.type,
      // `<updated>` describes the catalog's record rather than the file's
      // bytes, so it cannot tell the metadata cache whether the file changed.
      modifiedAt: MODIFIED_AT_UNSUPPORTED,
      bookMetadata:
        acquisition.length === undefined
          ? undefined
          : { size: acquisition.length.toString() },
    }
  },
  getFolderMetadata: async ({ link }) => ({ name: link.data.title }),
  download: async (link, providerCredentials, db) => {
    const { connectorId, acquisition } = toBookLinkData(link.data)
    const connector = await resolveConnector({
      connectorId,
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
