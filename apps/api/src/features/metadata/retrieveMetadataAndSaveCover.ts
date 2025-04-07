import fs from "node:fs"
import path from "node:path"
import { type BookMetadata, directives } from "@oboku/shared"
import type nano from "nano"
import type { Extractor } from "node-unrar-js"
import { Logger } from "@nestjs/common"
import type { Context } from "./types"
import { isBookProtected } from "../../lib/couch/isBookProtected"
import { pluginFacade } from "../../lib/plugins/facade"
import { reduceMetadata } from "../../lib/metadata/reduceMetadata"
import { getBookSourcesMetadata } from "../../lib/metadata/getBookSourcesMetadata"
import { getMetadataFromRarArchive } from "../../lib/books/metadata/getMetadataFromRarArchive"
import { getMetadataFromZipArchive } from "../../lib/books/metadata/getMetadataFromZipArchive"
import { detectMimeTypeFromContent } from "../../lib/utils"
import { downloadToTmpFolder } from "../../lib/archives/downloadToTmpFolder"
import { updateCover } from "./updateCover"
import { getRarArchive } from "../../lib/archives/getRarArchive"
import { atomicUpdate } from "../../lib/couch/dbHelpers"
import { AppConfigService } from "src/config/AppConfigService"
import { CoversService } from "src/covers/covers.service"

const logger = new Logger("retrieveMetadataAndSaveCover")

export const retrieveMetadataAndSaveCover = async (
  ctx: Context & {
    googleApiKey?: string
    db: nano.DocumentScope<unknown>
  },
  config: AppConfigService,
  coversService: CoversService,
) => {
  console.log(
    `[retrieveMetadataAndSaveCover]`,
    `syncMetadata run for user ${ctx.userName} with book ${ctx.book._id}`,
  )
  let bookNameForDebug = ""

  let fileToUnlink: string | undefined

  try {
    bookNameForDebug = reduceMetadata(ctx.book.metadata).title || ""

    console.log(
      `[retrieveMetadataAndSaveCover]`,
      `processing ${ctx.book._id} with link of type ${ctx.link.type}`,
      { link: ctx.link },
    )

    const bookIsProtected = await isBookProtected(ctx.db, ctx.book)

    // try to pre-fetch metadata before trying to download the file
    // in case some directive are needed to prevent downloading huge file.
    const { canDownload = false, ...linkResourceMetadata } =
      (await pluginFacade.getMetadata({
        link: ctx.link,
        credentials: ctx.credentials,
      })) ?? {}

    const { isbn, ignoreMetadataFile, ignoreMetadataSources, googleVolumeId } =
      directives.extractDirectivesFromName(linkResourceMetadata.name ?? "")

    const linkMetadata: BookMetadata = {
      type: "link",
      isbn,
      title: linkResourceMetadata.name,
      contentType: linkResourceMetadata.contentType,
      googleVolumeId,
      ...linkResourceMetadata.bookMetadata,
    }

    let contentType = linkMetadata.contentType
    /**
     * Not all plugins return the valid content type so
     * we can only make some assumptions based on what we have
     */
    const isMaybeExtractAble =
      contentType === undefined ||
      (contentType &&
        config.METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS.includes(contentType))

    const sourcesMetadata = ignoreMetadataSources
      ? []
      : await getBookSourcesMetadata(
          {
            ...linkMetadata,
            // some plugins returns filename and not title
            title: path.parse(linkMetadata.title ?? "").name,
          },
          {
            googleApiKey: ctx.googleApiKey,
            withGoogle: !bookIsProtected,
          },
          config,
        )

    const metadataList = [linkMetadata, ...sourcesMetadata]

    const { filepath: tmpFilePath, metadata: downloadMetadata } =
      canDownload && isMaybeExtractAble
        ? await downloadToTmpFolder(
            ctx.book,
            ctx.link,
            config,
            ctx.credentials,
          ).catch((error) => {
            /**
             * We have several reason for failing download but the most common one
             * is no more space left. We have about 500mb of space. In case of failure
             * we don't fail the entire process, we just keep the file metadata
             */
            logger.error(error)

            return {
              filepath: undefined,
              metadata: { contentType: undefined },
            }
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
      `[retrieveMetadataAndSaveCover]`,
      `syncMetadata processing ${ctx.book._id}`,
      {
        linkMetadata,
        contentType,
        tmpFilePath,
      },
    )

    const isRarArchive = contentType === "application/x-rar"
    let archiveExtractor: Extractor<Uint8Array> | undefined = undefined

    if (typeof tmpFilePath === "string" && tmpFilePath) {
      // before starting the extraction and if we still don't have a content type, we will try to get it from the file itself.
      if (!contentType) {
        contentType =
          (await detectMimeTypeFromContent(tmpFilePath)) || contentType
      }

      if (!ignoreMetadataFile) {
        if (isRarArchive) {
          archiveExtractor = await getRarArchive(tmpFilePath)
          const fileMetadata = await getMetadataFromRarArchive(
            archiveExtractor,
            contentType ?? ``,
            config,
          )

          console.log(`file metadata for book ${ctx.book._id}`, fileMetadata)

          metadataList.push(fileMetadata)
        } else if (
          contentType &&
          config.METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS.includes(contentType)
        ) {
          const fileMetadata = await getMetadataFromZipArchive(
            tmpFilePath,
            contentType,
            config,
          )

          console.log(`file metadata for book ${ctx.book._id}`, fileMetadata)

          metadataList.push(fileMetadata)
        } else {
          logger.log(
            `${contentType} cannot be extracted to retrieve information (cover, etc)`,
          )
        }
      }
    }

    await updateCover({
      book: ctx.book,
      ctx,
      metadataList,
      archiveExtractor,
      tmpFilePath,
      coversService,
    })

    console.log(
      `[retrieveMetadataAndSaveCover]`,
      `prepare to update ${ctx.book._id} with`,
      { metadataList },
    )

    await atomicUpdate(ctx.db, "book", ctx.book._id, (old) => {
      return {
        ...old,
        metadata: metadataList,
        lastMetadataUpdatedAt: new Date().getTime(),
        metadataUpdateStatus: null,
        lastMetadataUpdateError: null,
      }
    })

    return {
      link: {
        contentLength: fileContentLength,
      },
    }
  } catch (e) {
    console.log(
      `Error while processing book ${ctx.book._id} ${bookNameForDebug}`,
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
