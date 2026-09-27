/**
 * 401 credentials error
 * [{"domain":"global","reason":"authError","message":"Invalid Credentials","locationType":"header","location":"Authorization"}]
 */
import { authorize } from "./helpers.js"
import { google } from "googleapis"
import { type DataSourcePlugin, MODIFIED_AT_UNSUPPORTED } from "../types.js"
import { find } from "../../lib/couch/dbHelpers.js"
import { getDataSourceData } from "../helpers.js"
import { getSynchronizeAbleDataSourceFromItems } from "./sync.js"

const DRIVE_TYPE = "DRIVE"

export const dataSource: DataSourcePlugin<"DRIVE"> = {
  type: DRIVE_TYPE,
  getLinkCandidatesForItem: async (item, ctx) => {
    const links = await find(ctx.db, "link", {
      selector: { type: DRIVE_TYPE, data: { fileId: item.linkData.fileId } },
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
        linkType: DRIVE_TYPE,
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
    const { items = [] } =
      (await getDataSourceData<"DRIVE">({
        db: ctx.db,
        dataSourceId: ctx.dataSourceId,
      })) ?? {}

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
