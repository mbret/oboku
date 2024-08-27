import fs from "fs"
import path from "path"
import { pluginFacade } from "../../../libs/plugins/facade"
import { BookMetadata, directives } from "@oboku/shared"
import {
  detectMimeTypeFromContent,
  mergeSkippingUndefined
} from "../../../libs/utils"
import { Logger } from "@libs/logger"
import { METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS } from "../../../constants"
import { getBookSourcesMetadata } from "@libs/metadata/getBookSourcesMetadata"
import { reduceMetadata } from "@libs/metadata/reduceMetadata"
import { downloadToTmpFolder } from "@libs/download/downloadToTmpFolder"
import { isBookProtected } from "@libs/couch/isBookProtected"
import nano from "nano"
import { atomicUpdate } from "@libs/couch/dbHelpers"
import { getRarArchive } from "@libs/archives/getRarArchive"
import { Context } from "@functions/refreshMetadataLongProcess/src/types"
import { getMetadataFromRarArchive } from "@libs/books/metadata/getMetadataFromRarArchive"
import { getMetadataFromZipArchive } from "@libs/books/metadata/getMetadataFromZipArchive"
import { Extractor } from "node-unrar-js"
import { updateCover } from "./updateCover"

const logger = Logger.child({ module: "retrieveMetadataAndSaveCover" })

export const retrieveMetadataAndSaveCover = async (
  ctx: Context & {
    googleApiKey?: string
    db: nano.DocumentScope<unknown>
  }
) => {
  logger.info(
    `syncMetadata run for user ${ctx.userName} with book ${ctx.book._id}`
  )
  let bookNameForDebug = ""

  let fileToUnlink: string | undefined

  try {
    bookNameForDebug = reduceMetadata(ctx.book.metadata).title || ""

    logger.info(
      `syncMetadata processing ${ctx.book._id} with resource id ${ctx.link.resourceId}`
    )

    const bookIsProtected = await isBookProtected(ctx.db, ctx.book)

    // try to pre-fetch metadata before trying to download the file
    // in case some directive are needed to prevent downloading huge file.
    const { canDownload = false, ...linkResourceMetadata } =
      (await pluginFacade.getMetadata({
        linkType: ctx.link.type,
        credentials: ctx.credentials,
        resourceId: ctx.link.resourceId
      })) ?? {}

    const { isbn, ignoreMetadata } = directives.extractDirectivesFromName(
      linkResourceMetadata.name ?? ""
    )

    const existingLinkMetadata = ctx.book.metadata?.find(
      (item) => item.type === "link"
    )

    const newLinkMetadata: BookMetadata = mergeSkippingUndefined(
      existingLinkMetadata ?? {},
      {
        type: "link",
        isbn,
        title: linkResourceMetadata.name,
        contentType: linkResourceMetadata.contentType,
        ...linkResourceMetadata.bookMetadata
      }
    )

    let contentType = newLinkMetadata.contentType
    /**
     * Not all plugins return the valid content type so
     * we can only make some assumptions based on what we have
     */
    const isMaybeExtractAble =
      contentType === undefined ||
      (contentType &&
        METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS.includes(contentType))

    const sourcesMetadata = await getBookSourcesMetadata(
      {
        ...newLinkMetadata,
        // some plugins returns filename and not title
        title: path.parse(newLinkMetadata.title ?? "").name
      },
      {
        googleApiKey: ctx.googleApiKey,
        withGoogle: !bookIsProtected
      }
    )

    const metadataList = [newLinkMetadata, ...sourcesMetadata]

    const { filepath: tmpFilePath, metadata: downloadMetadata } =
      canDownload && isMaybeExtractAble
        ? await downloadToTmpFolder(ctx, ctx.book, ctx.link).catch((error) => {
            /**
             * We have several reason for failing download but the most common one
             * is no more space left. We have about 500mb of space. In case of failure
             * we don't fail the entire process, we just keep the file metadata
             */
            logger.error(error)

            return { filepath: undefined, metadata: { contentType: undefined } }
          })
        : { filepath: undefined, metadata: {} }

    let fileContentLength = 0

    if (tmpFilePath) {
      const stats = fs.statSync(tmpFilePath)
      fileContentLength = stats.size
    }

    fileToUnlink = tmpFilePath
    contentType = downloadMetadata.contentType || contentType

    console.log(
      `syncMetadata processing ${ctx.book._id}`,
      tmpFilePath,
      {
        linkMetadata: newLinkMetadata
      },
      contentType
    )

    const isRarArchive = contentType === "application/x-rar"
    let archiveExtractor: Extractor<Uint8Array> | undefined = undefined

    if (typeof tmpFilePath === "string" && tmpFilePath) {
      // before starting the extraction and if we still don't have a content type, we will try to get it from the file itself.
      if (!contentType) {
        contentType =
          (await detectMimeTypeFromContent(tmpFilePath)) || contentType
      }

      if (ignoreMetadata !== "file") {
        if (isRarArchive) {
          archiveExtractor = await getRarArchive(tmpFilePath)
          const fileMetadata = await getMetadataFromRarArchive(
            archiveExtractor,
            contentType ?? ``
          )

          console.log(`file metadata for book ${ctx.book._id}`, fileMetadata)

          metadataList.push(fileMetadata)
        } else if (
          contentType &&
          METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS.includes(contentType)
        ) {
          const fileMetadata = await getMetadataFromZipArchive(
            tmpFilePath,
            contentType
          )

          console.log(`file metadata for book ${ctx.book._id}`, fileMetadata)

          metadataList.push(fileMetadata)
        } else {
          logger.info(
            `${contentType} cannot be extracted to retrieve information (cover, etc)`
          )
        }
      }
    }

    await updateCover({
      book: ctx.book,
      ctx,
      metadataList,
      archiveExtractor,
      tmpFilePath
    })

    console.log(
      `metadataDaemon Finished processing book ${ctx.book._id} with resource id ${ctx.link.resourceId}`
    )

    await atomicUpdate(ctx.db, "book", ctx.book._id, (old) => {
      const linkMetadata = old.metadata?.find((item) => item.type === "link")

      return {
        ...old,
        /**
         * We should always use previous link metadata. Some
         * links do not have server state
         */
        metadata: metadataList.map((item) =>
          item.type !== "link"
            ? item
            : mergeSkippingUndefined(linkMetadata ?? {}, item)
        ),
        lastMetadataUpdatedAt: new Date().getTime(),
        metadataUpdateStatus: null,
        lastMetadataUpdateError: null
      }
    })

    return {
      link: {
        contentLength: fileContentLength
      }
    }
  } catch (e) {
    console.log(
      `Error while processing book ${ctx.book._id} ${bookNameForDebug}`
    )

    throw e
  } finally {
    try {
      /**
       * Make sure to remove temporary file in case of crash
       */
      if (typeof fileToUnlink === "string") {
        await fs.promises.unlink(fileToUnlink)
      }
    } catch (e) {
      console.error(e)
    }
  }
}
