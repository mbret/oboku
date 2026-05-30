import fs from "node:fs"
import path from "node:path"
import {
  type BookMetadata,
  type FileMetadata,
  type LinkMetadata,
  type UserMetadata,
  buildBookBucketCoverKey,
  directives,
  getBookCoverKey,
  resolveMetadataFetchEnabled,
  resolveMetadataFileDownloadEnabled,
} from "@oboku/shared"
import type nano from "nano"
import type { Extractor } from "node-unrar-js"
import { Logger } from "@nestjs/common"
import type { Context } from "./types"
import { isBookProtected } from "../../lib/couch/isBookProtected"
import { pluginFacade } from "src/plugins/facade"
import { reduceMetadata } from "../../lib/metadata/reduceMetadata"
import { getBookSourcesMetadata } from "../../lib/metadata/getBookSourcesMetadata"
import { getMetadataFromRarArchive } from "../../lib/books/metadata/getMetadataFromRarArchive"
import { getMetadataFromZipArchive } from "../../lib/books/metadata/getMetadataFromZipArchive"
import { detectMimeTypeFromContent } from "../../lib/utils"
import { downloadToTmpFolder } from "../../lib/archives/downloadToTmpFolder"
import { updateCover } from "./updateCover"
import { pickCoverMetadata } from "./pickCoverMetadata"
import { getRarArchive } from "../../lib/archives/getRarArchive"
import { atomicUpdate } from "../../lib/couch/dbHelpers"
import { AppConfigService } from "src/config/AppConfigService"
import { CoversService } from "src/covers/covers.service"
import { firstValueFrom } from "rxjs"
import { MODIFIED_AT_UNSUPPORTED } from "src/plugins/types"

const logger = new Logger("retrieveMetadataAndSaveCover")

/**
 * Decides whether the file's bytes still match what we extracted on a
 * previous run, so we can reuse the cached `type:"file"` metadata entry
 * instead of re-downloading.
 *
 * The primary fingerprint is the provider-reported `modifiedAt` on the
 * `link` source — both sides MUST report it, otherwise we refuse to
 * reuse. (Providers that don't expose `modifiedAt` — currently `file`
 * and `uri` — therefore never participate in this cache, by design.)
 *
 * `size` is then used as an opportunistic secondary check against
 * providers that fail to bump `modifiedAt` on a content change. It is
 * only meaningful when at least one side reports a value:
 *  - both defined + equal     ⇒ stronger confidence, reuse
 *  - both defined + different ⇒ invalidate
 *  - exactly one defined      ⇒ invalidate (provider went from
 *                                reporting size to not, or vice
 *                                versa — treat as suspicious)
 *  - both undefined           ⇒ no signal, fall back to `modifiedAt`
 *                                alone (intentional; this is the only
 *                                path some providers can take)
 */
const isCachedFileMetadataReusable = (
  previousLink: LinkMetadata | undefined,
  currentLink: LinkMetadata,
): boolean => {
  if (!previousLink?.modifiedAt || !currentLink.modifiedAt) return false
  if (previousLink.modifiedAt !== currentLink.modifiedAt) return false
  if (previousLink.size !== currentLink.size) return false

  return true
}

export const retrieveMetadataAndSaveCover = async (
  ctx: Context & {
    googleApiKey?: string
    db: nano.DocumentScope<unknown>
    /**
     * Hard refresh: bypass every reuse cache (cached file metadata,
     * cover blob match) so the file is re-downloaded (when allowed),
     * metadata re-extracted, and the cover regenerated even when
     * nothing changed. Useful as a recovery hatch when a previous run
     * was corrupted, when an S3 blob has gone missing, or after a fix
     * has been shipped that should be re-applied to existing books.
     */
    force?: boolean
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
    bookNameForDebug = reduceMetadata(ctx.book.metadata).title?.toString() || ""

    console.log(
      `[retrieveMetadataAndSaveCover]`,
      `processing ${ctx.book._id} with link of type ${ctx.link.type} with id ${ctx.link._id}`,
    )

    const bookIsProtected = await isBookProtected(ctx.db, ctx.book)
    const externalFetchEnabled = resolveMetadataFetchEnabled(
      ctx.book.metadataFetchEnabled,
      bookIsProtected,
    )
    const fileDownloadEnabled = resolveMetadataFileDownloadEnabled(
      ctx.book.metadataFileDownloadEnabled,
    )

    // try to pre-fetch metadata before trying to download the file
    // in case some directive are needed to prevent downloading huge file.
    const { canDownload = false, ...linkResourceMetadata } =
      await pluginFacade.getFileMetadata({
        link: ctx.link,
        providerCredentials: ctx.providerCredentials,
        db: ctx.db,
      })

    const { isbn, ignoreMetadataFile, ignoreMetadataSources, googleVolumeId } =
      directives.extractDirectivesFromName(linkResourceMetadata.name ?? "")

    // Collapse the in-memory sentinel back to `undefined` for persistence.
    const persistedModifiedAt =
      linkResourceMetadata.modifiedAt === MODIFIED_AT_UNSUPPORTED
        ? undefined
        : linkResourceMetadata.modifiedAt

    /**
     * The filename (with directives still embedded) IS the canonical title:
     * directives like `[oboku~isbn~…]` are parsed on demand at consumption
     * sites, so renaming the file in the provider remains the single source
     * of truth — no stale ISBN/volumeId stored alongside.
     */
    const linkMetadata: LinkMetadata = {
      type: "link",
      ...linkResourceMetadata.bookMetadata,
      title: linkResourceMetadata.name,
      contentType: linkResourceMetadata.contentType,
      modifiedAt: persistedModifiedAt,
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

    const previousLinkMetadata = ctx.book.metadata?.find(
      (entry): entry is LinkMetadata => entry.type === "link",
    )
    const previousFileMetadata = ctx.book.metadata?.find(
      (entry): entry is FileMetadata => entry.type === "file",
    )
    const previousUserMetadata = ctx.book.metadata?.find(
      (entry): entry is UserMetadata => entry.type === "user",
    )

    const fileUnchanged = isCachedFileMetadataReusable(
      previousLinkMetadata,
      linkMetadata,
    )

    const coverObjectKey = getBookCoverKey(ctx.userNameHex, ctx.book._id)

    const predictedCoverMetadata = pickCoverMetadata(
      [
        linkMetadata,
        ...(previousFileMetadata ? [previousFileMetadata] : []),
        ...(previousUserMetadata ? [previousUserMetadata] : []),
      ],
      ctx.book.metadataSourcePriority,
    )
    const predictedBucketCoverKey = predictedCoverMetadata?.coverLink
      ? buildBookBucketCoverKey({
          type: predictedCoverMetadata.type,
          value: predictedCoverMetadata.coverLink,
        })
      : undefined
    const fileCoverNeedsRefresh =
      predictedCoverMetadata?.type === "file" &&
      !!predictedCoverMetadata.coverLink &&
      (predictedBucketCoverKey !== ctx.book.bucketCoverKey ||
        !(await firstValueFrom(coversService.isCoverExist(coverObjectKey))))

    const skipDownload =
      !ctx.force &&
      !fileCoverNeedsRefresh &&
      (ignoreMetadataFile || (fileUnchanged && !!previousFileMetadata))

    if (skipDownload) {
      logger.log(
        `Skipping file download for ${ctx.book._id} (link.modifiedAt unchanged, reusing cached file metadata)`,
      )
    }

    if (canDownload && isMaybeExtractAble && !fileDownloadEnabled) {
      logger.log(
        `Skipping file download for ${ctx.book._id} (metadataFileDownloadEnabled=false)`,
      )
    }

    const { filepath: tmpFilePath } =
      canDownload && isMaybeExtractAble && fileDownloadEnabled && !skipDownload
        ? await downloadToTmpFolder(
            ctx.book,
            ctx.link,
            config,
            ctx.providerCredentials,
            ctx.db,
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
        : { filepath: undefined }

    let fileContentLength = 0

    if (tmpFilePath) {
      const stats = fs.statSync(tmpFilePath)
      fileContentLength = stats.size
    }

    fileToUnlink = tmpFilePath

    console.log(
      `[retrieveMetadataAndSaveCover]`,
      `syncMetadata processing for ${ctx.book._id}`,
      {
        contentType,
        tmpFilePath,
      },
    )

    const isRarArchive = contentType === "application/x-rar"
    let archiveExtractor: Extractor<Uint8Array> | undefined
    let freshFileMetadata: FileMetadata | undefined

    if (typeof tmpFilePath === "string" && tmpFilePath) {
      // before starting the extraction and if we still don't have a content type, we will try to get it from the file itself.
      if (!contentType) {
        contentType =
          (await detectMimeTypeFromContent(tmpFilePath)) || contentType
      }

      if (!ignoreMetadataFile) {
        if (isRarArchive) {
          archiveExtractor = await getRarArchive(tmpFilePath)
          freshFileMetadata = await getMetadataFromRarArchive(
            archiveExtractor,
            contentType ?? ``,
          )
        } else if (
          contentType &&
          config.METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS.includes(contentType)
        ) {
          freshFileMetadata = await getMetadataFromZipArchive(
            tmpFilePath,
            contentType,
          )
        } else {
          logger.log(
            `${contentType} cannot be extracted to retrieve information (cover, etc)`,
          )
        }
      }
    }

    /**
     * Carry the previously-extracted `type:"file"` entry forward when
     * the file is unchanged and no fresh extraction happened — without
     * this, the cached `authors`/`publisher`/`date`/`coverLink` would
     * silently disappear under `metadataFileDownloadEnabled=false`,
     * unsupported content types, or download failures.
     */
    const reusedFileMetadata =
      !freshFileMetadata && !ctx.force && fileUnchanged && !ignoreMetadataFile
        ? previousFileMetadata
        : undefined

    /**
     * Single Google Books lookup — runs after extraction so it sees the
     * most authoritative ISBN we have. Priority mirrors the global
     * `user > directive > file > …` chain.
     */
    const lookupTitle = path.parse(linkMetadata.title?.toString() ?? "").name
    const lookupIsbn =
      previousUserMetadata?.isbn ??
      isbn ??
      freshFileMetadata?.isbn ??
      reusedFileMetadata?.isbn

    const sourcesMetadata =
      ignoreMetadataSources || !externalFetchEnabled
        ? []
        : await getBookSourcesMetadata(
            {
              // Some plugins return the filename (with extension) instead
              // of a clean title; strip the extension for the lookup.
              title: lookupTitle,
              isbn: lookupIsbn,
              googleVolumeId,
            },
            {
              googleApiKey: ctx.googleApiKey,
              withExternalSources: externalFetchEnabled,
            },
            config,
          )

    if (freshFileMetadata) {
      logger.log(`Pushing file metadata for book ${ctx.book._id}`)
    }

    const metadataList: BookMetadata[] = [
      linkMetadata,
      ...sourcesMetadata,
      ...(freshFileMetadata
        ? [freshFileMetadata]
        : reusedFileMetadata
          ? [reusedFileMetadata]
          : []),
      ...(previousUserMetadata ? [previousUserMetadata] : []),
    ]

    const { bucketCoverKey: nextBucketCoverKey } = await updateCover({
      book: ctx.book,
      ctx,
      metadataList,
      archiveExtractor,
      tmpFilePath,
      coversService,
      force: ctx.force,
    })

    console.log(
      `[retrieveMetadataAndSaveCover]`,
      `prepare to update ${ctx.book._id} with new metadata`,
    )

    await atomicUpdate(ctx.db, "book", ctx.book._id, (old) => {
      return {
        ...old,
        metadata: metadataList,
        bucketCoverKey: nextBucketCoverKey ?? old.bucketCoverKey,
        lastMetadataUpdatedAt: Date.now(),
        metadataUpdateStatus: null,
        lastMetadataUpdateError: null,
      }
    })

    /**
     * Only report a length when we actually downloaded the file —
     * otherwise the caller would overwrite the previously-recorded
     * link.contentLength with 0 on every cached refresh.
     */
    return {
      link: {
        contentLength: tmpFilePath ? fileContentLength : undefined,
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
