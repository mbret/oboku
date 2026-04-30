/**
 * @see https://github.com/dropbox/dropbox-sdk-js/tree/main/examples/javascript/download
 */
import { Dropbox, type files } from "dropbox"
import { Readable } from "node:stream"
import { READER_ACCEPTED_EXTENSIONS } from "@oboku/shared"
import type {
  DataSourcePlugin,
  SynchronizeAbleItem,
} from "src/features/plugins/types"
import { find } from "src/lib/couch/dbHelpers"
import { createThrottler } from "src/lib/utils"
import { createError, getDataSourceData } from "../helpers"

const DROPBOX_TYPE = "dropbox"

export const dataSource: DataSourcePlugin<"dropbox"> = {
  type: DROPBOX_TYPE,
  getLinkCandidatesForItem: async (item, ctx) => {
    const links = await find(ctx.db, "link", {
      selector: { type: DROPBOX_TYPE, data: { fileId: item.linkData.fileId } },
    })
    return {
      links: links.map((link) => ({
        ...link,
        /**
         * In principle, if the user is syncing a resource ID he will
         * always have valid credentials for this ID.
         */
        isUsingSameProviderCredentials: true,
      })),
    }
  },
  getCollectionCandidatesForItem: async (item, ctx) => {
    const collections = await find(ctx.db, "obokucollection", {
      selector: {
        linkType: DROPBOX_TYPE,
        linkData: { fileId: item.linkData.fileId },
      },
    })
    return {
      collections: collections.map((c) => ({
        ...c,
        /** Same as links: when syncing this resource, credentials apply. */
        isUsingSameProviderCredentials: true,
      })),
    }
  },
  getFolderMetadata: async ({ link, providerCredentials }) => {
    const token = providerCredentials.accessToken
    const dbx = new Dropbox({
      accessToken: `${token ?? ""}`,
    })
    const { fileId } = link.data

    const response = await dbx.filesGetMetadata({
      path: `${fileId}`,
    })

    return {
      name: response.result.name,
    }
  },
  getFileMetadata: async ({ link, providerCredentials }) => {
    const token = providerCredentials.accessToken
    const dbx = new Dropbox({
      accessToken: `${token ?? ""}`,
    })
    const { fileId } = link.data

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
  download: async (link, providerCredentials) => {
    const token = providerCredentials.accessToken
    const dbx = new Dropbox({
      accessToken: `${token ?? ""}`,
    })
    const { fileId } = link.data

    const response = await dbx.filesDownload({
      path: `${fileId}`,
    })

    // The Dropbox SDK types the result as `files.FileMetadata`, but on Node
    // the runtime response also includes a `fileBinary` Buffer with the file
    // contents. The typings don't expose it, so we narrow it locally.
    const results = response.result as files.FileMetadata & {
      fileBinary?: Buffer
    }
    const fileBinary: Buffer = results.fileBinary || Buffer.from("", "binary")

    const stream = new Readable({
      read() {
        this.push(fileBinary)
        this.push(null)
      },
    })

    return {
      stream,
    }
  },
  sync: async ({ providerCredentials, dataSourceId, db }) => {
    const throttle = createThrottler(50)

    const token = providerCredentials.accessToken
    const dbx = new Dropbox({
      accessToken: token ?? undefined,
    })

    const { folderId } =
      (await getDataSourceData<"dropbox">({
        db,
        dataSourceId: dataSourceId,
      })) ?? {}

    if (!folderId) {
      throw createError("unknown")
    }

    const getContentsFromFolder = throttle(
      async (id: string): Promise<SynchronizeAbleItem<"dropbox">[]> => {
        type Res = Awaited<
          ReturnType<typeof dbx.filesListFolder>
        >["result"]["entries"]

        const getNextRes = throttle(
          async (
            cursor?:
              | Awaited<
                  ReturnType<typeof dbx.filesListFolder>
                >["result"]["cursor"]
              | undefined,
          ): Promise<Res> => {
            let response: Awaited<
              ReturnType<typeof dbx.filesListFolderContinue>
            >
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
            }
            return data
          },
        )

        const results = await getNextRes()

        return Promise.all(
          results.map(async (item): Promise<SynchronizeAbleItem<"dropbox">> => {
            if (item[".tag"] === "file") {
              return {
                type: "file",
                linkData: {
                  fileId: (item as files.FileMetadataReference).id,
                },
                name: item.name,
                modifiedAt: item.server_modified,
              }
            }

            return {
              type: "folder",
              linkData: {
                fileId: (item as files.FolderMetadataReference).id,
              },
              items: await getContentsFromFolder(
                (item as files.FolderMetadataReference).id,
              ),
              name: item.name,
              modifiedAt: new Date().toISOString(),
            }
          }),
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
