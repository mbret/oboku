/**
 * 401 credentials error
 * [{"domain":"global","reason":"authError","message":"Invalid Credentials","locationType":"header","location":"Authorization"}]
 */
import { authorize } from "./helpers"
import { google } from "googleapis"
import type { DataSourcePlugin } from "src/lib/plugins/types"
import { getDataSourceData } from "../helpers"
import { getSynchronizeAbleDataSourceFromItems } from "./sync"

export const generateResourceId = (driveId: string) => `drive-${driveId}`
export const extractIdFromResourceId = (resourceId: string) =>
  resourceId.replace(`drive-`, ``)

export const dataSource: DataSourcePlugin = {
  type: `DRIVE`,
  getFolderMetadata: async ({ link, data }) => {
    const auth = await authorize({ credentials: data })
    const drive = google.drive({
      version: "v3",
      auth,
    })

    const metadata = (
      await drive.files.get(
        {
          fileId: extractIdFromResourceId(link.resourceId),
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
  getFileMetadata: async ({ link, data }) => {
    const auth = await authorize({ credentials: data })
    const drive = google.drive({
      version: "v3",
      auth,
    })

    const metadata = (
      await drive.files.get(
        {
          fileId: extractIdFromResourceId(link.resourceId),
          fields: "size, name, mimeType, modifiedTime",
        },
        { responseType: "json" },
      )
    ).data

    return {
      name: metadata.name ?? "",
      contentType: metadata.mimeType || undefined,
      modifiedAt: metadata.modifiedTime || undefined,
      canDownload: true,
      bookMetadata: {
        size: metadata.size || undefined,
        contentType: metadata.mimeType || undefined,
      },
    }
  },
  download: async (link, credentials) => {
    if (!link.resourceId) {
      throw new Error("Invalid google drive file uri")
    }

    const auth = await authorize({ credentials })

    const drive = google.drive({
      version: "v3",
      auth,
    })

    const response = await drive.files.get(
      {
        fileId: extractIdFromResourceId(link.resourceId),
        alt: "media",
      },
      { responseType: "stream" },
    )

    return {
      stream: response.data,
    }
  },
  sync: async (ctx) => {
    const { items = [] } =
      (await getDataSourceData<"DRIVE">({
        db: ctx.db,
        dataSourceId: ctx.dataSourceId,
      })) ?? {}

    const auth = await authorize({
      credentials: ctx.data,
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
