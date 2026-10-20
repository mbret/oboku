import { getDataFromDataSource, PLUGIN_ONE_DRIVE_TYPE } from "@oboku/shared"
import { findCandidates } from "../helpers.js"
import { type DataSourcePlugin, MODIFIED_AT_UNSUPPORTED } from "../types.js"
import { downloadOneDriveDriveItem, getOneDriveDriveItem } from "./graph.js"
import { getSynchronizeAbleDataSourceFromItems } from "./sync.js"

export const dataSource: DataSourcePlugin<"one-drive"> = {
  type: PLUGIN_ONE_DRIVE_TYPE,
  getLinkCandidatesForItem: async (item, ctx) => ({
    links: await findCandidates(ctx, "link", {
      type: PLUGIN_ONE_DRIVE_TYPE,
      data: {
        driveId: item.linkData.driveId,
        fileId: item.linkData.fileId,
      },
    }),
  }),
  getCollectionCandidatesForItem: async (item, ctx) => ({
    collections: await findCandidates(ctx, "obokucollection", {
      type: PLUGIN_ONE_DRIVE_TYPE,
      data: {
        driveId: item.linkData.driveId,
        fileId: item.linkData.fileId,
      },
    }),
  }),
  getFolderMetadata: async ({ link, providerCredentials }) => {
    const item = await getOneDriveDriveItem({
      accessToken: providerCredentials.accessToken,
      driveId: link.data.driveId,
      fileId: link.data.fileId,
    })

    return {
      name: item.name ?? "",
      modifiedAt: item.lastModifiedDateTime || undefined,
    }
  },
  getFileMetadata: async ({ link, providerCredentials }) => {
    const item = await getOneDriveDriveItem({
      accessToken: providerCredentials.accessToken,
      driveId: link.data.driveId,
      fileId: link.data.fileId,
    })

    return {
      name: item.name ?? "",
      contentType: item.file?.mimeType || undefined,
      modifiedAt: item.lastModifiedDateTime || MODIFIED_AT_UNSUPPORTED,
      canDownload: !!item["@microsoft.graph.downloadUrl"],
      bookMetadata: {
        size: item.size?.toString(),
        contentType: item.file?.mimeType || undefined,
      },
    }
  },
  download: async (link, providerCredentials) => {
    const { stream } = await downloadOneDriveDriveItem({
      accessToken: providerCredentials.accessToken,
      driveId: link.data.driveId,
      fileId: link.data.fileId,
    })

    return {
      stream,
    }
  },
  sync: async ({ dataSource, providerCredentials }) => {
    const { items = [] } = getDataFromDataSource<"one-drive">(dataSource) ?? {}

    return getSynchronizeAbleDataSourceFromItems({
      accessToken: providerCredentials.accessToken,
      items,
    })
  },
}
