import fs from "node:fs"
import path from "node:path"
import { Injectable, Logger } from "@nestjs/common"
import {
  type BookDocType,
  type BookMetadata,
  type DataSourceType,
  type FileMetadata,
  type LinkDocType,
  type LinkMetadata,
  type ProviderApiCredentials,
  type UserMetadata,
  buildBookBucketCoverKey,
  directives,
  getBookCoverKey,
  resolveMetadataFetchEnabled,
  resolveMetadataFileDownloadEnabled,
} from "@oboku/shared"
import type nano from "nano"
import type { Extractor } from "node-unrar-js"
import { firstValueFrom } from "rxjs"
import { InstanceConfigService } from "src/admin/instance-config/instance-config.service"
import { AppConfigService } from "src/config/AppConfigService"
import { CouchService, emailToNameHex } from "src/couch/couch.service"
import { atomicUpdate, findOne } from "src/couch/dbHelpers"
import { isBookProtected } from "src/couch/isBookProtected"
import { CoversService } from "src/covers/covers.service"
import { detectMimeTypeFromContent } from "src/features/metadata/archives/detectMimeTypeFromContent"
import { getMetadataFromRarArchive } from "src/features/metadata/archives/getMetadataFromRarArchive"
import { getMetadataFromZipArchive } from "src/features/metadata/archives/getMetadataFromZipArchive"
import { getRarArchive } from "src/features/metadata/archives/getRarArchive"
import { getBookSourcesMetadata } from "src/features/metadata/getBookSourcesMetadata"
import { pickCoverMetadata } from "src/features/metadata/pickCoverMetadata"
import { reduceMetadata } from "src/features/metadata/reduceMetadata"
import { PluginsService } from "src/plugins/plugins.service"
import { MODIFIED_AT_UNSUPPORTED } from "src/plugins/types"

type Context = {
  userName: string
  userNameHex: string
  providerCredentials: ProviderApiCredentials<DataSourceType>
  book: BookDocType
  link: LinkDocType
}

type RefreshContext = Context & {
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
  fileDownloadMaxSizeBytes: number
}

type UpdateCoverResult = {
  bucketCoverKey?: string
}

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

@Injectable()
export class BooksMetadataService {
  private readonly logger = new Logger(BooksMetadataService.name)

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly couchService: CouchService,
    private readonly coversService: CoversService,
    private readonly pluginsService: PluginsService,
    private readonly instanceConfigService: InstanceConfigService,
  ) {}

  public refreshMetadata = async (
    body: { bookId: string; force?: boolean },
    providerCredentials: ProviderApiCredentials<DataSourceType>,
    userEmail: string,
  ) => {
    const { bookId, force } = body

    const userNameHex = emailToNameHex(userEmail)

    const db = await this.couchService.createNanoInstanceForUser({
      email: userEmail,
    })

    const book = await findOne("book", { selector: { _id: bookId } }, { db })

    if (!book) throw new Error(`Unable to find book ${bookId}`)

    if (book.metadataUpdateStatus !== "fetching") {
      await atomicUpdate(db, "book", book._id, (old) => ({
        ...old,
        metadataUpdateStatus: "fetching" as const,
      }))
    }

    const firstLinkId = (book.links || [])[0] || "-1"

    const link = await findOne(
      "link",
      { selector: { _id: firstLinkId } },
      { db },
    )

    if (!link) throw new Error(`Unable to find link ${firstLinkId}`)

    const { fileDownloadMaxSizeBytes } =
      this.instanceConfigService.getConfig().value

    try {
      await this.retrieveMetadataAndSaveCover({
        userName: userEmail,
        userNameHex,
        providerCredentials,
        book,
        link,
        googleApiKey: this.appConfigService.GOOGLE_API_KEY,
        db,
        force,
        fileDownloadMaxSizeBytes,
      })
    } catch (e) {
      await atomicUpdate(db, "book", book._id, (old) => ({
        ...old,
        metadataUpdateStatus: null,
        lastMetadataUpdateError: "unknown",
      }))

      throw e
    }

    this.logger.log(`metadata refreshed for ${book._id}`)
  }

  private async retrieveMetadataAndSaveCover(ctx: RefreshContext) {
    this.logger.log(
      `syncMetadata run for user ${ctx.userName} with book ${ctx.book._id}`,
    )
    let bookNameForDebug = ""

    let fileToUnlink: string | undefined

    try {
      bookNameForDebug =
        reduceMetadata(ctx.book.metadata).title?.toString() || ""

      this.logger.log(
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
        await this.pluginsService.getFileMetadata({
          link: ctx.link,
          providerCredentials: ctx.providerCredentials,
          db: ctx.db,
        })

      const {
        isbn,
        ignoreMetadataFile,
        ignoreMetadataSources,
        googleVolumeId: directiveGoogleVolumeId,
      } = directives.extractDirectivesFromName(linkResourceMetadata.name ?? "")

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
          this.appConfigService.METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS.includes(
            contentType,
          ))

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
          !(await firstValueFrom(
            this.coversService.isCoverExist(coverObjectKey),
          )))

      const skipDownload =
        !ctx.force &&
        !fileCoverNeedsRefresh &&
        (ignoreMetadataFile || (fileUnchanged && !!previousFileMetadata))

      if (skipDownload) {
        this.logger.log(
          `Skipping file download for ${ctx.book._id} (link.modifiedAt unchanged, reusing cached file metadata)`,
        )
      }

      if (canDownload && isMaybeExtractAble && !fileDownloadEnabled) {
        this.logger.log(
          `Skipping file download for ${ctx.book._id} (metadataFileDownloadEnabled=false)`,
        )
      }

      const reportedFileSizeBytes = Number(linkMetadata.size)
      const exceedsFileDownloadSizeLimit =
        Number.isFinite(reportedFileSizeBytes) &&
        reportedFileSizeBytes > ctx.fileDownloadMaxSizeBytes

      if (
        canDownload &&
        isMaybeExtractAble &&
        fileDownloadEnabled &&
        exceedsFileDownloadSizeLimit
      ) {
        this.logger.log(
          `Skipping file download for ${ctx.book._id} (reported size ${reportedFileSizeBytes} bytes exceeds the ${ctx.fileDownloadMaxSizeBytes} bytes limit)`,
        )
      }

      const { filepath: tmpFilePath } =
        canDownload &&
        isMaybeExtractAble &&
        fileDownloadEnabled &&
        !skipDownload &&
        !exceedsFileDownloadSizeLimit
          ? await this.pluginsService
              .downloadLinkToTmp({
                book: ctx.book,
                link: ctx.link,
                providerCredentials: ctx.providerCredentials,
                db: ctx.db,
                maxSizeBytes: ctx.fileDownloadMaxSizeBytes,
              })
              .catch((error) => {
                /**
                 * We have several reason for failing download but the most common one
                 * is no more space left. We have about 500mb of space. In case of failure
                 * we don't fail the entire process, we just keep the file metadata
                 */
                this.logger.error(error)

                return {
                  filepath: undefined,
                  metadata: { contentType: undefined },
                }
              })
          : { filepath: undefined }

      fileToUnlink = tmpFilePath

      this.logger.log(`syncMetadata processing for ${ctx.book._id}`, {
        contentType,
        tmpFilePath,
      })

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
            this.appConfigService.METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS.includes(
              contentType,
            )
          ) {
            freshFileMetadata = await getMetadataFromZipArchive(
              tmpFilePath,
              contentType,
            )
          } else {
            this.logger.log(
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
      const lookupGoogleVolumeId =
        directiveGoogleVolumeId ??
        freshFileMetadata?.googleVolumeId ??
        reusedFileMetadata?.googleVolumeId

      const sourcesMetadata =
        ignoreMetadataSources || !externalFetchEnabled
          ? []
          : await getBookSourcesMetadata(
              {
                // Some plugins return the filename (with extension) instead
                // of a clean title; strip the extension for the lookup.
                title: lookupTitle,
                isbn: lookupIsbn,
                googleVolumeId: lookupGoogleVolumeId,
              },
              {
                googleApiKey: ctx.googleApiKey,
                withExternalSources: externalFetchEnabled,
              },
              this.appConfigService,
            )

      if (freshFileMetadata) {
        this.logger.log(`Pushing file metadata for book ${ctx.book._id}`)
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

      const { bucketCoverKey: nextBucketCoverKey } = await this.updateCover({
        book: ctx.book,
        ctx,
        metadataList,
        archiveExtractor,
        tmpFilePath,
        force: ctx.force,
        catalogIdentityIsConfirmed: lookupGoogleVolumeId !== undefined,
      })

      this.logger.log(`prepare to update ${ctx.book._id} with new metadata`)

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
    } catch (e) {
      this.logger.log(
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
        this.logger.error(e)
      }
    }
  }

  private async updateCover({
    metadataList,
    archiveExtractor,
    book,
    ctx,
    tmpFilePath,
    force = false,
    catalogIdentityIsConfirmed,
  }: {
    ctx: Context
    book: BookDocType
    metadataList: BookMetadata[]
    archiveExtractor?: Extractor<Uint8Array> | undefined
    tmpFilePath?: string
    /**
     * Hard refresh: regenerate the cover even when the bucket key
     * already matches the picked source and the blob exists.
     */
    force?: boolean
    /** Whether the catalog match is known to describe this exact book. */
    catalogIdentityIsConfirmed?: boolean
  }): Promise<UpdateCoverResult> {
    const coverObjectKey = getBookCoverKey(ctx.userNameHex, ctx.book._id)
    const metadataForCover = pickCoverMetadata(
      metadataList,
      book.metadataSourcePriority,
      { catalogIdentityIsConfirmed },
    )
    const expectedBucketCoverKey = metadataForCover?.coverLink
      ? buildBookBucketCoverKey({
          type: metadataForCover.type,
          value: metadataForCover.coverLink,
        })
      : undefined

    if (
      !force &&
      expectedBucketCoverKey !== undefined &&
      expectedBucketCoverKey === book.bucketCoverKey &&
      (await firstValueFrom(this.coversService.isCoverExist(coverObjectKey)))
    ) {
      this.logger.log(
        `Skipping cover update for ${book._id} since the bucket cover already matches the picked source`,
      )

      return {}
    }

    if (
      metadataForCover?.type === "file" &&
      metadataForCover.coverLink &&
      archiveExtractor
    ) {
      const saved = await this.coversService.saveCoverFromRarEntry(
        coverObjectKey,
        archiveExtractor,
        metadataForCover.coverLink,
      )

      return saved && expectedBucketCoverKey
        ? { bucketCoverKey: expectedBucketCoverKey }
        : {}
    }

    if (
      metadataForCover?.type === "file" &&
      metadataForCover.coverLink &&
      tmpFilePath
    ) {
      const saved = await this.coversService.saveCoverFromZipEntry(
        coverObjectKey,
        tmpFilePath,
        metadataForCover.coverLink,
      )

      return saved && expectedBucketCoverKey
        ? { bucketCoverKey: expectedBucketCoverKey }
        : {}
    }

    if (
      metadataForCover?.type === "googleBookApi" &&
      metadataForCover.coverLink
    ) {
      const saved = await this.coversService.saveCoverFromUrl(
        coverObjectKey,
        metadataForCover.coverLink,
      )

      return saved && expectedBucketCoverKey
        ? { bucketCoverKey: expectedBucketCoverKey }
        : {}
    }

    return {}
  }
}
