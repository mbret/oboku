import fs from "fs"
import path from "path"
import { pluginFacade } from "../plugins/facade"
import {
  BookDocType,
  BookMetadata,
  LinkDocType,
  directives
} from "@oboku/shared"
import { detectMimeTypeFromContent, mergeSkippingUndefined } from "../utils"
import { Logger } from "@libs/logger"
import { saveCoverFromZipArchiveToBucket } from "./saveCoverFromZipArchiveToBucket"
import { saveCoverFromExternalLinkToBucket } from "./saveCoverFromExternalLinkToBucket"
import { METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS } from "../../constants"
import { getBookSourcesMetadata } from "@libs/metadata/getBookSourcesMetadata"
import { reduceMetadata } from "@libs/metadata/reduceMetadata"
import { downloadToTmpFolder } from "@libs/download/downloadToTmpFolder"
import { isBookProtected } from "@libs/couch/isBookProtected"
import nano from "nano"
import { atomicUpdate } from "@libs/couch/dbHelpers"
import { saveCoverFromRarArchiveToBucket } from "./saveCoverFromRarArchiveToBucket"
import { getRarArchive } from "@libs/archives/getRarArchive"
import { getMetadataFromRarArchive } from "@libs/metadata/getMetadataFromRarArchive"
import { getMetadataFromZipArchive } from "@libs/metadata/getMetadataFromZipArchive"

const logger = Logger.child({ module: "retrieveMetadataAndSaveCover" })

export type RetrieveMetadataAndSaveCoverContext = {
  userName: string
  userNameHex: string
  credentials?: any
  book: BookDocType
  link: LinkDocType
}

export const retrieveMetadataAndSaveCover = async (
  ctx: RetrieveMetadataAndSaveCoverContext & {
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
    /**
     * At this point we have the real content-type so our assumptions
     * are corrects.
     */
    const isExtractAble = contentType
      ? METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS.includes(contentType)
      : false

    console.log(
      `syncMetadata processing ${ctx.book._id}`,
      tmpFilePath,
      {
        linkMetadata: newLinkMetadata
      },
      contentType
    )

    if (!canDownload || !isExtractAble || ignoreMetadata === "file") {
      // @todo prioritize which cover we take
      const coverLink = metadataList.find(
        (metadata) => metadata.coverLink
      )?.coverLink

      if (coverLink) {
        await saveCoverFromExternalLinkToBucket(ctx, ctx.book, coverLink)
      }
    }

    if (typeof tmpFilePath === "string" && tmpFilePath) {
      // before starting the extraction and if we still don't have a content type, we will try to get it from the file itself.
      if (!contentType) {
        contentType =
          (await detectMimeTypeFromContent(tmpFilePath)) || contentType
      }

      const coverObjectKey = `cover-${ctx.userNameHex}-${ctx.book._id}`

      if (ignoreMetadata !== "file") {
        if (contentType === "application/x-rar") {
          const extractor = await getRarArchive(tmpFilePath)

          await saveCoverFromRarArchiveToBucket(coverObjectKey, extractor)

          const fileMetadata = await getMetadataFromRarArchive(
            extractor,
            contentType
          )

          metadataList.push(fileMetadata)
        } else if (
          contentType &&
          METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS.includes(contentType)
        ) {
          const fileMetadata = await getMetadataFromZipArchive(
            tmpFilePath,
            contentType
          )

          logger.info(`coverRelativePath`, fileMetadata.coverLink)

          metadataList.push(fileMetadata)

          if (fileMetadata.coverLink) {
            await saveCoverFromZipArchiveToBucket(
              coverObjectKey,
              tmpFilePath,
              fileMetadata.coverLink
            )
          } else {
            console.log(`No cover path found for ${tmpFilePath}`)
          }
        } else {
          logger.info(
            `${contentType} cannot be extracted to retrieve information (cover, etc)`
          )
        }
      }
    }

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
