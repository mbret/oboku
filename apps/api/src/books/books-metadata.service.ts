import fs from "node:fs"
import { Injectable, Logger } from "@nestjs/common"
import {
  type BookDocType,
  type BookMetadata,
  type DataSourceType,
  type FileMetadata,
  type LegacyFileMetadata,
  type LinkDocType,
  type LinkMetadata,
  type ProviderApiCredentials,
  type UserMetadata,
  buildBookBucketCoverKey,
  directives,
  getBookCoverKey,
  getBookMetadataFields,
  getBookMetadataSource,
  getMetadataFromBook,
  isCatalogEnabled,
  isBookProtected,
  isCatalogEntry,
  resolveMetadataFetchEnabled,
  resolveMetadataFileDownloadEnabled,
} from "@oboku/shared"
import type nano from "nano"
import type { Archive } from "@prose-reader/archive-reader"
import {
  GOOGLE_BOOKS_PROVIDER_ID,
  type MetadataProvider,
} from "@prose-reader/metadata-fetcher"
import { firstValueFrom } from "rxjs"
import { InstanceConfigService } from "../admin/instance-config/instance-config.service.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { CouchService, emailToNameHex } from "../couch/couch.service.js"
import { atomicUpdate, findOne, getSettings } from "../couch/dbHelpers.js"
import { findProtectedTagIds } from "../couch/findProtectedTagIds.js"
import { CoversService } from "../covers/covers.service.js"
import { BOOK_TITLE_FORMAT } from "../features/metadata/bookTitleFormat.js"
import { getMetadataFromArchive } from "../features/metadata/archives/getMetadataFromArchive.js"
import { isMaybeExtractableContentType } from "../features/metadata/archives/isMaybeExtractableContentType.js"
import { openArchive } from "../features/metadata/archives/openArchive.js"
import { catalogLookupInput } from "../features/metadata/catalogLookupInput.js"
import { createCatalogProviders } from "../features/metadata/catalogProviders.js"
import { toFileMetadata } from "../features/metadata/legacy/toFileMetadata.js"
import { pickCoverMetadata } from "../features/metadata/pickCoverMetadata.js"
import { refreshCatalogEntry } from "../features/metadata/refreshCatalogEntry.js"
import { PluginsService } from "../plugins/plugins.service.js"
import { MODIFIED_AT_UNSUPPORTED } from "../plugins/types.js"

type Context = {
  userName: string
  userNameHex: string
  providerCredentials: ProviderApiCredentials<DataSourceType>
  book: BookDocType
  link: LinkDocType
}

type RefreshContext = Context & {
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
 * reuse. (Providers that don't expose `modifiedAt` — currently `file`,
 * `uri` and `opds` — therefore never participate in this cache, by design.)
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

  private createCatalogProviders(): ReadonlyArray<MetadataProvider> {
    return createCatalogProviders({
      googleApiKey: this.instanceConfigService.getConfig().value.googleApiKey,
      googleBooksBaseUrl: this.appConfigService.GOOGLE_BOOK_API_URL,
    })
  }

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

    this.logger.log(`lambda executed with success for ${book._id}`)
  }

  private readonly logArchiveCloseFailure = (error: unknown) => {
    this.logger.error(error)
  }

  private readonly logUntypedFileIsNotAnArchive = (
    error: unknown,
  ): undefined => {
    this.logger.log(`An untyped file is not an archive to extract: ${error}`)

    return undefined
  }

  private async retrieveMetadataAndSaveCover(ctx: RefreshContext) {
    this.logger.log(
      `syncMetadata run for user ${ctx.userName} with book ${ctx.book._id}`,
    )
    let bookNameForDebug = ""

    let fileToUnlink: string | undefined
    let archive: Archive | undefined

    try {
      bookNameForDebug =
        getMetadataFromBook(ctx.book, BOOK_TITLE_FORMAT).title?.toString() || ""

      this.logger.log(
        `processing ${ctx.book._id} with link of type ${ctx.link.type} with id ${ctx.link._id}`,
      )

      const bookIsProtected =
        ctx.book.tags.length > 0 &&
        isBookProtected(await findProtectedTagIds(ctx.db), ctx.book)
      const externalFetchEnabled = resolveMetadataFetchEnabled(
        ctx.book.metadataFetchEnabled,
        bookIsProtected,
      )
      const accountSettings = await getSettings(ctx.db)
      const catalogProviders = this.createCatalogProviders().filter(({ id }) =>
        isCatalogEnabled(accountSettings?.catalogs, id),
      )
      const isGoogleBooksAsked = catalogProviders.some(
        ({ id }) => id === GOOGLE_BOOKS_PROVIDER_ID,
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

      const contentType = linkMetadata.contentType
      /**
       * Not all plugins return the valid content type so
       * we can only make some assumptions based on what we have
       */
      const isMaybeExtractAble = isMaybeExtractableContentType(contentType)

      const previousLinkMetadata = ctx.book.metadata?.find(
        (entry): entry is LinkMetadata => entry.type === "link",
      )
      const previousFileMetadata = ctx.book.metadata?.find(
        (entry) => entry.type === "file",
      )
      const previousCatalogMetadata = ctx.book.metadata?.find(isCatalogEntry)
      const isCatalogLookupAllowed =
        !ignoreMetadataSources &&
        externalFetchEnabled &&
        catalogProviders.length > 0
      const previousUserMetadata = ctx.book.metadata?.find(
        (entry): entry is UserMetadata => entry.type === "user",
      )

      const fileUnchanged = isCachedFileMetadataReusable(
        previousLinkMetadata,
        linkMetadata,
      )

      /**
       * Carry the previously-extracted `type:"file"` entry forward when
       * the file is unchanged and no fresh extraction happened — without
       * this, the cached `authors`/`publisher`/`date`/`coverLink` would
       * silently disappear under `metadataFileDownloadEnabled=false`,
       * unsupported content types, or download failures.
       */
      const isPreviousFileMetadataReusable =
        !ctx.force && fileUnchanged && !ignoreMetadataFile
      const reusableFileMetadata = isPreviousFileMetadataReusable
        ? previousFileMetadata
        : undefined
      const isDownloadNeededForMetadata =
        ctx.force ||
        !(ignoreMetadataFile || (fileUnchanged && !!previousFileMetadata))
      const lookupGoogleVolumeId = isGoogleBooksAsked
        ? directiveGoogleVolumeId
        : undefined
      const lookUpCatalogEntry = (
        fileMetadataForLookup: FileMetadata | LegacyFileMetadata | undefined,
      ) =>
        isCatalogLookupAllowed
          ? refreshCatalogEntry({
              bookId: ctx.book._id,
              lookupInput: catalogLookupInput({
                fileMetadata:
                  fileMetadataForLookup &&
                  toFileMetadata(fileMetadataForLookup),
                linkName: linkMetadata.title,
                userIsbn: previousUserMetadata?.isbn,
                directiveIsbn: isbn,
                directiveGoogleVolumeId: lookupGoogleVolumeId,
              }),
              previous: previousCatalogMetadata,
              providers: catalogProviders,
            })
          : Promise.resolve(undefined)
      /**
       * When the file's metadata does not need a download, the catalogs
       * answer first, so the cover prediction sees the entry this refresh
       * stores rather than the one it replaces.
       */
      const catalogMetadataBeforeDownload = isDownloadNeededForMetadata
        ? undefined
        : await lookUpCatalogEntry(reusableFileMetadata)

      const coverObjectKey = getBookCoverKey(ctx.userNameHex, ctx.book._id)

      const predictedCoverMetadata = pickCoverMetadata(
        [
          linkMetadata,
          ...(catalogMetadataBeforeDownload
            ? [catalogMetadataBeforeDownload]
            : []),
          ...(previousFileMetadata ? [previousFileMetadata] : []),
          ...(previousUserMetadata ? [previousUserMetadata] : []),
        ],
        ctx.book.metadataSourcePriority,
      )
      const predictedCoverLink = predictedCoverMetadata
        ? getBookMetadataFields(predictedCoverMetadata).coverLink
        : undefined
      const predictedBucketCoverKey =
        predictedCoverMetadata && predictedCoverLink
          ? buildBookBucketCoverKey({
              type: predictedCoverMetadata.type,
              value: predictedCoverLink,
            })
          : undefined
      const fileCoverNeedsRefresh =
        predictedCoverMetadata?.type === "file" &&
        !!predictedCoverLink &&
        (predictedBucketCoverKey !== ctx.book.bucketCoverKey ||
          !(await firstValueFrom(
            this.coversService.isCoverExist(coverObjectKey),
          )))

      const skipDownload =
        !isDownloadNeededForMetadata && !fileCoverNeedsRefresh

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
                this.logger.error(
                  `File download failed for ${ctx.book._id}: ${error.message}`,
                  error.stack,
                )

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

      if (
        typeof tmpFilePath === "string" &&
        tmpFilePath &&
        !ignoreMetadataFile
      ) {
        const archiveOptions = {
          name: linkResourceMetadata.name,
          encodingFormat: contentType,
        }
        const isUntypedFile = !contentType

        archive = isUntypedFile
          ? await openArchive(tmpFilePath, archiveOptions).catch(
              this.logUntypedFileIsNotAnArchive,
            )
          : await openArchive(tmpFilePath, archiveOptions)
      }

      const freshFileMetadata = archive
        ? await getMetadataFromArchive(archive)
        : undefined

      const fileMetadata = freshFileMetadata ?? reusableFileMetadata
      const catalogMetadata = isDownloadNeededForMetadata
        ? await lookUpCatalogEntry(fileMetadata)
        : catalogMetadataBeforeDownload

      if (freshFileMetadata) {
        this.logger.log(`Pushing file metadata for book ${ctx.book._id}`)
      }

      const metadataList: BookMetadata[] = [
        linkMetadata,
        ...(catalogMetadata ? [catalogMetadata] : []),
        ...(fileMetadata ? [fileMetadata] : []),
        ...(previousUserMetadata ? [previousUserMetadata] : []),
      ]

      const { bucketCoverKey: nextBucketCoverKey } = await this.updateCover({
        book: ctx.book,
        ctx,
        metadataList,
        archive,
        force: ctx.force,
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
      await archive?.close().catch(this.logArchiveCloseFailure)

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
    archive,
    book,
    ctx,
    force = false,
  }: {
    ctx: Context
    book: BookDocType
    metadataList: BookMetadata[]
    archive?: Archive
    /**
     * Hard refresh: regenerate the cover even when the bucket key
     * already matches the picked source and the blob exists.
     */
    force?: boolean
  }): Promise<UpdateCoverResult> {
    const coverObjectKey = getBookCoverKey(ctx.userNameHex, ctx.book._id)
    const metadataForCover = pickCoverMetadata(
      metadataList,
      book.metadataSourcePriority,
    )
    const coverLink = metadataForCover
      ? getBookMetadataFields(metadataForCover).coverLink
      : undefined
    const expectedBucketCoverKey =
      metadataForCover && coverLink
        ? buildBookBucketCoverKey({
            type: metadataForCover.type,
            value: coverLink,
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

    if (metadataForCover?.type === "file" && coverLink && archive) {
      const saved = await this.coversService.saveCoverFromArchive(
        coverObjectKey,
        archive,
        coverLink,
      )

      return saved && expectedBucketCoverKey
        ? { bucketCoverKey: expectedBucketCoverKey }
        : {}
    }

    const isCatalogCover =
      metadataForCover !== undefined &&
      getBookMetadataSource(metadataForCover) === "catalog"

    if (isCatalogCover && coverLink) {
      const saved = await this.coversService.saveCoverFromUrl(
        coverObjectKey,
        coverLink,
      )

      return saved && expectedBucketCoverKey
        ? { bucketCoverKey: expectedBucketCoverKey }
        : {}
    }

    return {}
  }
}
