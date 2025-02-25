/**
 * @see https://github.com/dropbox/dropbox-sdk-js/tree/main/examples/javascript/download
 */
import nodeFetch from "node-fetch"
import { Dropbox, type files } from "dropbox"
import { Readable } from "stream"
import {
  type DropboxDataSourceData,
  READER_ACCEPTED_EXTENSIONS,
} from "@oboku/shared"
import type { PromiseReturnType } from "../../types"
import type {
  DataSourcePlugin,
  SynchronizeAbleDataSource,
} from "@libs/plugins/types"
import { createThrottler } from "@libs/utils"
import { createError } from "../helpers"

const extractIdFromResourceId = (resourceId: string) =>
  resourceId.replace(`dropbox-`, ``)
const generateResourceId = (id: string) => `dropbox-${id}`

export const dataSource: DataSourcePlugin = {
  type: `dropbox`,
  getMetadata: async ({ id, credentials }) => {
    const dbx = new Dropbox({
      accessToken: credentials.accessToken,
      fetch: nodeFetch,
    })
    const fileId = extractIdFromResourceId(id)

    const response = await dbx.filesGetMetadata({
      path: `${fileId}`,
    })

    return {
      name: response.result.name,
      canDownload: true,
    }
  },
  /**
   * @see https://www.dropbox.com/developers/documentation/http/documentation#files-download
   */
  download: async (link, credentials) => {
    const dbx = new Dropbox({
      accessToken: credentials.accessToken,
      fetch: nodeFetch,
    })
    const fileId = extractIdFromResourceId(link.resourceId)

    const response = await dbx.filesDownload({
      path: `${fileId}`,
    })

    const results = response.result
    // @todo fix the type and check it exists, its weird
    const fileBinary: Buffer =
      (results as any).fileBinary || Buffer.from("", "binary")

    const stream = new Readable({
      read() {
        this.push(fileBinary)
        this.push(null)
      },
    })

    return {
      metadata: {
        name: "",
        size: results.size.toString(),
      },
      stream,
    }
  },
  sync: async ({ credentials }, helpers) => {
    const throttle = createThrottler(50)

    const dbx = new Dropbox({
      accessToken: credentials.accessToken,
      fetch: nodeFetch,
    })

    const { folderId } =
      await helpers.getDataSourceData<DropboxDataSourceData>()

    if (!folderId) {
      throw createError("unknown")
    }

    const getContentsFromFolder = throttle(
      async (id: string): Promise<SynchronizeAbleDataSource["items"]> => {
        type Res = PromiseReturnType<
          typeof dbx.filesListFolder
        >["result"]["entries"]

        const getNextRes = throttle(
          async (
            cursor?:
              | PromiseReturnType<
                  typeof dbx.filesListFolder
                >["result"]["cursor"]
              | undefined,
          ): Promise<Res> => {
            let response: PromiseReturnType<typeof dbx.filesListFolderContinue>
            if (cursor) {
              response = await dbx.filesListFolderContinue({ cursor })
            } else {
              response = await dbx.filesListFolder({
                path: id,
                include_deleted: false,
                include_non_downloadable_files: false,
                include_media_info: true,
              })
            }
            const data = response.result.entries.filter(
              (entry) =>
                entry[".tag"] === "folder" ||
                READER_ACCEPTED_EXTENSIONS.some((extension) =>
                  entry.name.toLowerCase().endsWith(extension),
                ),
            )

            if (response.result.has_more) {
              return [...data, ...(await getNextRes(response.result.cursor))]
            } else {
              return data
            }
          },
        )

        const results = await getNextRes()

        return Promise.all(
          results.map(
            async (
              item,
            ): Promise<SynchronizeAbleDataSource["items"][number]> => {
              if (item[".tag"] === "file") {
                return {
                  type: "file",
                  resourceId: generateResourceId(
                    (item as files.FileMetadataReference).id,
                  ),
                  name: item.name,
                  modifiedAt: item.server_modified,
                }
              }

              return {
                type: "folder",
                resourceId: generateResourceId(
                  (item as files.FolderMetadataReference).id,
                ),
                items: await getContentsFromFolder(
                  (item as files.FolderMetadataReference).id,
                ),
                name: item.name,
                modifiedAt: new Date().toISOString(),
              }
            },
          ),
        )
      },
    )

    const [items, rootFolderResponse] = await Promise.all([
      await getContentsFromFolder(folderId),
      await dbx.filesGetMetadata({
        path: folderId,
      }),
    ])

    return {
      items,
      name: rootFolderResponse.result.name,
    }
  },
}
