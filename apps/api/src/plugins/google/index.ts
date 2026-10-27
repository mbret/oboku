/**
 * 401 credentials error
 * [{"domain":"global","reason":"authError","message":"Invalid Credentials","locationType":"header","location":"Authorization"}]
 */
import { authorize } from "./helpers.js"
import { google } from "googleapis"
import { getDataFromDataSource } from "@oboku/shared"
import { type DataSourcePlugin, MODIFIED_AT_UNSUPPORTED } from "../types.js"
import { findCandidates } from "../helpers.js"
import { getSynchronizeAbleDataSourceFromItems } from "./sync.js"

const DRIVE_TYPE = "DRIVE"

export const dataSource: DataSourcePlugin<"DRIVE"> = {
  type: DRIVE_TYPE,
  getLinkCandidatesForItem: async (item, ctx) => ({
    links: await findCandidates(ctx, "link", {
      type: DRIVE_TYPE,
      data: { fileId: item.linkData.fileId },
    }),
  }),
  getCollectionCandidatesForItem: async (item, ctx) => ({
    collections: await findCandidates(ctx, "obokucollection", {
      type: DRIVE_TYPE,
      data: { fileId: item.linkData.fileId },
    }),
  }),
  getFolderMetadata: async ({ link, providerCredentials }) => {
    const auth = await authorize({ credentials: providerCredentials })
    const drive = google.drive({
      version: "v3",
      auth,
    })

    const metadata = (
      await drive.files.get(
        {
          fileId: link.data.fileId,
          fields: "size, name, modifiedTime",
        },
        { responseType: "json" },
      )
    ).data

    return {
      name: metadata.name ?? "",
      modifiedAt: metadata.modifiedTime || undefined,
    }
  },
  getFileMetadata: async ({ link, providerCredentials }) => {
    const auth = await authorize({ credentials: providerCredentials })
    const drive = google.drive({
      version: "v3",
      auth,
    })

    const metadata = (
      await drive.files.get(
        {
          fileId: link.data.fileId,
          fields: "size, name, mimeType, modifiedTime",
        },
        { responseType: "json" },
      )
    ).data

    return {
      name: metadata.name ?? "",
      contentType: metadata.mimeType || undefined,
      modifiedAt: metadata.modifiedTime || MODIFIED_AT_UNSUPPORTED,
      canDownload: true,
      bookMetadata: {
        size: metadata.size || undefined,
        contentType: metadata.mimeType || undefined,
      },
    }
  },
  download: async (link, providerCredentials) => {
    const auth = await authorize({ credentials: providerCredentials })

    const drive = google.drive({
      version: "v3",
      auth,
    })

    const response = await drive.files.get(
      {
        fileId: link.data.fileId,
        alt: "media",
      },
      { responseType: "stream" },
    )

    return {
      stream: response.data,
    }
  },
  sync: async (ctx) => {
    const { items = [] } = getDataFromDataSource<"DRIVE">(ctx.dataSource) ?? {}

    const auth = await authorize({
      credentials: ctx.providerCredentials,
    })

    const drive = google.drive({
      version: "v3",
      auth,
    })

    return getSynchronizeAbleDataSourceFromItems({
      items,
      drive,
    })
  },
}
