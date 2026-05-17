import fs from "node:fs"
import path from "node:path"
import {
  type BookMetadata,
  type FileMetadata,
  type GoogleBookApiMetadata,
  type LinkMetadata,
  directives,
  getBookBucketCoverKeyType,
  getBookCoverKey,
  resolveMetadataFetchEnabled,
  resolveMetadataFileDownloadEnabled,
} from "@oboku/shared"
import type nano from "nano"
import type { Extractor } from "node-unrar-js"
import { Logger } from "@nestjs/common"
import type { Context } from "./types"
import { isBookProtected } from "../../lib/couch/isBookProtected"
import { pluginFacade } from "../plugins/facade"
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
import { firstValueFrom } from "rxjs"
import { pickCoverMetadata } from "./pickCoverMetadata"
import { MODIFIED_AT_UNSUPPORTED } from "../plugins/types"

const logger = new Logger("retrieveMetadataAndSaveCover")

/**
 * Decides whether the file's bytes still match what we extracted on a
 * previous run, so we can reuse the cached `type:"file"` metadata entry
 * (and the cover blob already in S3) instead of re-downloading.
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
     * cover blob match) so the file is re-downloaded (when allowed)
     * and the cover regenerated even when nothing changed. Useful as
     * a recovery hatch when a previous run was corrupted or after a
     * fix has been shipped that should be re-applied to existing
     * books.
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

    /**
     * Try to reuse the previously-extracted `type:"file"` entry when the
     * provider reports the file is unchanged (same `modifiedAt` + `size`
     * on the `link` source). This avoids re-downloading the whole file
     * just to re-derive identical metadata. Reuse is gated on:
     *  - the user not having added an `[oboku~ignore-metadata-file~…]`
     *    directive since the previous run (in which case the cached
     *    entry must be dropped);
     *  - having a previous `link` entry to compare against;
     *  - having a previous `file` entry to actually reuse.
     * If we reuse the file metadata, we also need to make sure the cover
     * blob is still in S3 when the resolved cover source is `file`,
     * otherwise we must download to regenerate it.
     */
    const previousLinkMetadata = ctx.book.metadata?.find(
      (entry): entry is LinkMetadata => entry.type === "link",
    )
    const previousFileMetadata = ctx.book.metadata?.find(
      (entry): entry is FileMetadata => entry.type === "file",
    )

    const lookupTitle = path.parse(linkMetadata.title?.toString() ?? "").name
    /**
     * Pick the best ISBN we have before touching Google Books. The
     * filename directive (`[oboku~isbn~…]`) is the user's explicit
     * override and always wins; otherwise we fall back to the ISBN
     * previously extracted from the file itself (OPF `dc:identifier`
     * or ComicInfo `<GTIN>`). That fallback means an unchanged file
     * whose metadata we don't re-extract this run still feeds its ISBN
     * to Google — without it, the embedded identifier would be ignored
     * except on the run that first extracted it.
     */
    const preDownloadLookupIsbn = isbn ?? previousFileMetadata?.isbn

    const runSourcesLookup = (lookupIsbn: string | undefined) =>
      ignoreMetadataSources || !externalFetchEnabled
        ? Promise.resolve<GoogleBookApiMetadata[]>([])
        : getBookSourcesMetadata(
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

    const sourcesMetadata = await runSourcesLookup(preDownloadLookupIsbn)
    const fileUnchanged = isCachedFileMetadataReusable(
      previousLinkMetadata,
      linkMetadata,
    )
    /**
     * `force` short-circuits every reuse path: even if the link's
     * fingerprint matches and a previous `file` entry exists, we
     * pretend nothing is cached so the file gets re-downloaded
     * (when downloads are allowed) and metadata re-extracted.
     */
    const canReuseFileMetadata =
      !ctx.force &&
      fileUnchanged &&
      !ignoreMetadataFile &&
      !!previousFileMetadata

    const candidateMetadataList: BookMetadata[] = [
      linkMetadata,
      ...sourcesMetadata,
      ...(canReuseFileMetadata ? [previousFileMetadata] : []),
    ]
    /**
     * Determine which source would supply the cover for this run if we
     * skipped the download. If that source is `file`, we can only reuse
     * the cached cover blob when (a) the bucket image was actually
     * uploaded from a `file` source on the previous successful run (so
     * the blob currently in S3 came from the file, not from another
     * provider whose priority has since been demoted) and (b) the blob
     * still exists in S3. Otherwise we must download to regenerate it.
     *
     * `bucketCoverKey` is the source of truth here, NOT a freshly
     * recomputed pick from `metadata` + current priority — the latter
     * drifts when the user reorders sources or edits metadata and would
     * incorrectly let us reuse a stale blob.
     */
    const coverObjectKey = getBookCoverKey(ctx.userNameHex, ctx.book._id)
    const projectedCoverSource = pickCoverMetadata(
      candidateMetadataList,
      ctx.book.metadataSourcePriority,
    )?.type
    const bucketCoverSource = ctx.book.bucketCoverKey
      ? getBookBucketCoverKeyType(ctx.book.bucketCoverKey)
      : undefined
    /**
     * Short-circuit the S3 head request when we already know we won't
     * reuse the cached file metadata: the result is only consumed via
     * `skipDownload` below, which itself requires `canReuseFileMetadata`.
     * `updateCover` will run its own existence check later for the
     * download path, so skipping here avoids a redundant round-trip.
     */
    const coverFromFileNeedsDownload =
      canReuseFileMetadata &&
      projectedCoverSource === "file" &&
      (bucketCoverSource !== "file" ||
        !(await firstValueFrom(coversService.isCoverExist(coverObjectKey))))

    const skipDownload = canReuseFileMetadata && !coverFromFileNeedsDownload

    if (skipDownload) {
      logger.log(
        `Skipping file download for ${ctx.book._id} (link.modifiedAt unchanged, reusing cached file metadata)`,
      )
    }

    const metadataList: BookMetadata[] = [linkMetadata, ...sourcesMetadata]

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

    /**
     * Preserve the previously-extracted `type:"file"` entry whenever we
     * trust it (`canReuseFileMetadata`) AND no fresh extraction will
     * happen on this run (no `tmpFilePath`). Tying this to
     * `!tmpFilePath` rather than `skipDownload` matters when the cover
     * blob is missing/mismatched (forcing `skipDownload=false`) but the
     * download is then skipped anyway — e.g. `fileDownloadEnabled` is
     * false, `canDownload` is false, the content type isn't extractable,
     * or the download itself failed. Without this, legacy books without
     * a `bucketCoverKey` marker would silently drop their cached
     * authors/publisher/date/coverLink fields under
     * `metadataFileDownloadEnabled=false`.
     */
    if (canReuseFileMetadata && !tmpFilePath && previousFileMetadata) {
      metadataList.push(previousFileMetadata)
    }

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

          logger.log(`Pushing file metadata for book ${ctx.book._id}`)

          metadataList.push(freshFileMetadata)
        } else if (
          contentType &&
          config.METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS.includes(contentType)
        ) {
          freshFileMetadata = await getMetadataFromZipArchive(
            tmpFilePath,
            contentType,
          )

          logger.log(`Pushing file metadata for book ${ctx.book._id}`)

          metadataList.push(freshFileMetadata)
        } else {
          logger.log(
            `${contentType} cannot be extracted to retrieve information (cover, etc)`,
          )
        }
      }
    }

    /**
     * Re-run the Google Books lookup when file extraction surfaced an
     * ISBN we didn't know about before the download (typical after a
     * first sync, or after the user embeds/edits the ISBN inside the
     * file). We skip this when the filename directive already pinned
     * the ISBN — that's the explicit user override and we don't want a
     * possibly-stale embedded value to undo it.
     */
    const freshFileIsbn = freshFileMetadata?.isbn
    const shouldRefetchSources =
      !isbn &&
      freshFileIsbn !== undefined &&
      freshFileIsbn !== preDownloadLookupIsbn &&
      !ignoreMetadataSources &&
      externalFetchEnabled

    if (shouldRefetchSources) {
      logger.log(
        `Re-running metadata sources lookup for ${ctx.book._id} with ISBN extracted from file`,
      )

      const refreshed = await runSourcesLookup(freshFileIsbn)
      const refreshedTypes = new Set(refreshed.map((entry) => entry.type))
      const previousIndex = metadataList.findIndex(
        (entry) => entry.type === "googleBookApi",
      )

      if (previousIndex >= 0 && refreshedTypes.has("googleBookApi")) {
        metadataList.splice(previousIndex, 1)
      }

      metadataList.push(...refreshed)
    }

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
