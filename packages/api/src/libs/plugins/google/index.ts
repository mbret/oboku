/**
 * 401 credentials error
 * [{"domain":"global","reason":"authError","message":"Invalid Credentials","locationType":"header","location":"Authorization"}]
 */
import { authorize } from "./helpers"
import { drive_v3, google } from "googleapis"
import {
  GoogleDriveDataSourceData,
  READER_SUPPORTED_MIME_TYPES,
  READER_SUPPORTED_EXTENSIONS
} from "@oboku/shared"
import { configure } from "./configure"
import { createThrottler } from "../helpers"
import path from "path"
import {
  DataSourcePlugin,
  SynchronizeAbleDataSource
} from "@libs/plugins/types"

export { configure }

export const generateResourceId = (driveId: string) => `drive-${driveId}`
export const extractIdFromResourceId = (resourceId: string) =>
  resourceId.replace(`drive-`, ``)

const isFolder = (
  file: NonNullable<drive_v3.Schema$FileList["files"]>[number]
) => file.mimeType === "application/vnd.google-apps.folder"

export const dataSource: DataSourcePlugin = {
  type: `DRIVE`,
  getMetadata: async (link, credentials) => {
    const auth = await authorize({ credentials })
    const drive = google.drive({
      version: "v3",
      auth
    })

    const metadata = (
      await drive.files.get(
        {
          fileId: extractIdFromResourceId(link.resourceId),
          fields: "size, name, mimeType"
        },
        { responseType: "json" }
      )
    ).data

    return {
      title: metadata.name || "",
      contentType: metadata.mimeType || undefined,
      shouldDownload: true
    }
  },
  download: async (link, credentials) => {
    if (!link.resourceId) {
      throw new Error("Invalid google drive file uri")
    }

    const auth = await authorize({ credentials })

    const drive = google.drive({
      version: "v3",
      auth
    })

    const metadata = (
      await drive.files.get(
        {
          fileId: extractIdFromResourceId(link.resourceId),
          fields: "size, name"
        },
        { responseType: "json" }
      )
    ).data

    const response = await drive.files.get(
      {
        fileId: extractIdFromResourceId(link.resourceId),
        alt: "media"
      },
      { responseType: "stream" }
    )

    return {
      stream: response.data,
      metadata: {
        ...(metadata.size && {
          size: metadata.size
        }),
        name: "",
        ...(metadata.name && {
          name: metadata.name
        }),
        contentType: response.headers["content-type"]
      }
    }
  },
  sync: async (ctx, helpers) => {
    const throttle = createThrottler(50)

    const auth = await authorize(ctx)
    const drive = google.drive({
      version: "v3",
      auth
    })

    const { folderId } =
      await helpers.getDataSourceData<GoogleDriveDataSourceData>()

    if (!folderId) {
      throw helpers.createError("unknown")
    }

    const getContentsFromFolder = throttle(
      async (id: string): Promise<SynchronizeAbleDataSource["items"]> => {
        type Res = NonNullable<drive_v3.Schema$FileList["files"]>

        const getNextRes = throttle(
          async (pageToken?: string | undefined): Promise<Res> => {
            const response = await drive.files.list({
              spaces: "drive",
              q: `
            '${id}' in parents and (
              mimeType='application/vnd.google-apps.folder' 
              ${READER_SUPPORTED_MIME_TYPES.map(
                (mimeType) => ` or mimeType='${mimeType}'`
              ).join("")}
            )
          `,
              includeItemsFromAllDrives: true,
              fields:
                "nextPageToken, files(id, kind, name, mimeType, modifiedTime, parents, modifiedTime, trashed)",
              pageToken: pageToken,
              supportsAllDrives: true,
              pageSize: 10
            })

            const data = response.data.files || []
            pageToken = response.data.nextPageToken || undefined
            if (!pageToken) {
              return data
            } else {
              const nextRes = await getNextRes(pageToken)
              return [...data, ...nextRes]
            }
          }
        )

        const files = await getNextRes()

        return Promise.all(
          files
            .filter(
              (file) =>
                file.trashed !== true &&
                (isFolder(file) ||
                  READER_SUPPORTED_EXTENSIONS.includes(
                    path.extname(file.name || ``).toLowerCase()
                  ))
            )
            .map(
              async (
                file
              ): Promise<SynchronizeAbleDataSource["items"][number]> => {
                if (isFolder(file)) {
                  return {
                    type: "folder",
                    resourceId: generateResourceId(file.id || ""),
                    items: await getContentsFromFolder(file.id || ""),
                    name: file.name || "",
                    modifiedAt: file.modifiedTime || new Date().toISOString()
                  }
                }

                return {
                  type: "file",
                  resourceId: generateResourceId(file.id || ""),
                  name: file.name || "",
                  modifiedAt: file.modifiedTime || new Date().toISOString()
                }
              }
            )
        )
      }
    )

    try {
      const [items, rootFolderResponse] = await Promise.all([
        await getContentsFromFolder(folderId),
        await drive.files.get({
          fileId: folderId
        })
      ])

      return {
        items,
        name: rootFolderResponse.data.name || ""
      }
    } catch (e) {
      if ((e as any)?.code === 401) {
        throw helpers.createError("unauthorized", e as Error)
      }
      const errors = (e as any)?.response?.data?.error?.errors
      if (errors && Array.isArray(errors)) {
        errors.forEach((error: any) => {
          if (error?.reason === "rateLimitExceeded") {
            throw helpers.createError("rateLimitExceeded", e as Error)
          }
        })
      }

      throw e
    }
  }
}
