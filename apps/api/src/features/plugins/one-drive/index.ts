import { PLUGIN_ONE_DRIVE_TYPE } from "@oboku/shared"
import { find } from "src/lib/couch/dbHelpers"
import type { DataSourcePlugin } from "../types"
import { downloadOneDriveDriveItem, getOneDriveDriveItem } from "./graph"

const unsupportedSync = () => {
  throw new Error("OneDrive server-side sync is not implemented yet")
}

function getRequiredAccessToken(
  providerCredentials?: { accessToken?: string | null } | null,
) {
  const accessToken = providerCredentials?.accessToken

  if (!accessToken) {
    throw new Error("OneDrive access token is required")
  }

  return accessToken
}

export const dataSource: DataSourcePlugin<"one-drive"> = {
  type: PLUGIN_ONE_DRIVE_TYPE,
  getLinkCandidatesForItem: async (item, ctx) => {
    const links = await find(ctx.db, "link", {
      selector: {
        type: PLUGIN_ONE_DRIVE_TYPE,
        data: {
          driveId: item.linkData.driveId,
          fileId: item.linkData.fileId,
        },
      },
    })

    return {
      links: links.map((link) => ({
        ...link,
        isUsingSameProviderCredentials: true,
      })),
    }
  },
  getCollectionCandidatesForItem: async (item, ctx) => {
    const collections = await find(ctx.db, "obokucollection", {
      selector: {
        linkType: PLUGIN_ONE_DRIVE_TYPE,
        linkData: {
          driveId: item.linkData.driveId,
          fileId: item.linkData.fileId,
        },
      },
    })

    return {
      collections: collections.map((collection) => ({
        ...collection,
        isUsingSameProviderCredentials: true,
      })),
    }
  },
  getFolderMetadata: async ({ link, providerCredentials }) => {
    const accessToken = getRequiredAccessToken(providerCredentials)
    const item = await getOneDriveDriveItem({
      accessToken,
      driveId: link.data.driveId,
      fileId: link.data.fileId,
    })

    return {
      name: item.name ?? "",
      modifiedAt: item.lastModifiedDateTime || undefined,
    }
  },
  getFileMetadata: async ({ link, providerCredentials }) => {
    const accessToken = getRequiredAccessToken(providerCredentials)
    const item = await getOneDriveDriveItem({
      accessToken,
      driveId: link.data.driveId,
      fileId: link.data.fileId,
    })

    return {
      name: item.name ?? "",
      contentType: item.file?.mimeType || undefined,
      modifiedAt: item.lastModifiedDateTime || undefined,
      canDownload: !!item["@microsoft.graph.downloadUrl"],
      bookMetadata: {
        size: item.size?.toString(),
        contentType: item.file?.mimeType || undefined,
      },
    }
  },
  download: async (link, providerCredentials) => {
    const accessToken = getRequiredAccessToken(providerCredentials)
    const { stream } = await downloadOneDriveDriveItem({
      accessToken,
      driveId: link.data.driveId,
      fileId: link.data.fileId,
    })

    return {
      stream,
    }
  },
  sync: async () => unsupportedSync(),
}
