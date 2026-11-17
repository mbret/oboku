import type createNano from "nano"
import { lastValueFrom } from "rxjs"
import {
  type BookDocType,
  getBookCoverKey,
  isBookProtected,
} from "@oboku/shared"
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common"
import { CouchService, emailToNameHex } from "../couch/couch.service.js"
import { CoversService } from "../covers/covers.service.js"
import { fetchByIds, find } from "../couch/dbHelpers.js"
import { findOne } from "../couch/findOne.js"
import { findProtectedTagIds } from "../couch/findProtectedTagIds.js"
import type { UserPostgresEntity } from "../features/postgres/entities.js"
import { PluginsService } from "../plugins/plugins.service.js"
import { GoogleConnectionService } from "../provider-connections/google/google-connection.service.js"
import { toByteCount } from "../http/contentLength.js"
import { toGoogleApiFailure } from "../http/googleApiFailure.js"
import { isRecord } from "../http/isRecord.js"
import {
  compareByTitle,
  compareNewestFirst,
  isBookShown,
  SERVED_COVER_TYPE,
  SERVED_LINK_TYPE,
  toCatalogPage,
  toServedFile,
  toServedShelfBookIds,
  toServedTitle,
  toShelfTitle,
} from "./opds-books.js"

/** Drive's reasons for a 403 that a later request may not get. */
const DRIVE_RATE_LIMIT_REASONS: ReadonlyArray<string> = [
  "rateLimitExceeded",
  "userRateLimitExceeded",
]

/** The status Drive answered a refused request with, and its first error's reason. */
const toDriveRefusal = (error: unknown) => {
  const { status, body } = toGoogleApiFailure(error)
  const driveError = isRecord(body) ? body.error : undefined
  const errors = isRecord(driveError) ? driveError.errors : undefined
  const firstError: unknown = Array.isArray(errors) ? errors[0] : undefined
  const reason = isRecord(firstError) ? firstError.reason : undefined

  return { status, reason: typeof reason === "string" ? reason : undefined }
}

/**
 * What a reading app gets for a file Drive would not send. A 401 would read
 * as wrong catalog credentials, so Drive's refusals never answer one.
 *
 * Once Drive answered the file's metadata, a 403 on its download is a limit,
 * on the rate or on the file's downloads: gaxios keeps no body of a streamed
 * answer to read the reason from.
 */
const toDriveFailure = ({
  refusal: { status, reason },
  isFileReadable,
}: {
  refusal: ReturnType<typeof toDriveRefusal>
  isFileReadable: boolean
}) => {
  const isRateLimitReason =
    reason !== undefined && DRIVE_RATE_LIMIT_REASONS.includes(reason)
  const isRateLimited =
    status === 429 || (status === 403 && (isFileReadable || isRateLimitReason))
  const isFileUnreachable = status === 404 || status === 403

  if (isRateLimited) return new ServiceUnavailableException()

  if (isFileUnreachable) return new NotFoundException()

  return new BadGatewayException()
}

/**
 * The summaries of the books the catalogs serve, in the library's order, and
 * the ids of every book under a protected tag, served or not.
 */
const readServedLibrary = async (db: createNano.DocumentScope<unknown>) => {
  const [protectedTagIds, driveLinks, bookSummaries] = await Promise.all([
    findProtectedTagIds(db),
    find(db, "link", { selector: { type: SERVED_LINK_TYPE }, fields: ["_id"] }),
    find(db, "book", {
      selector: {},
      fields: ["_id", "links", "tags", "isNotInterested", "createdAt"],
    }),
  ])
  const driveLinkIds = new Set(driveLinks.map(({ _id }) => _id))
  const summaries: Pick<
    BookDocType,
    "_id" | "links" | "tags" | "isNotInterested" | "createdAt"
  >[] = bookSummaries

  return {
    summaries: summaries
      .filter(function isServedBook(book) {
        const firstLinkId = book.links[0]
        const isFirstLinkOnDrive =
          firstLinkId !== undefined && driveLinkIds.has(firstLinkId)

        return isFirstLinkOnDrive && isBookShown({ book, protectedTagIds })
      })
      .toSorted(compareNewestFirst),
    protectedBookIds: new Set(
      summaries
        .filter((book) => isBookProtected(protectedTagIds, book))
        .map(({ _id }) => _id),
    ),
  }
}

/**
 * The shelves the catalogs list, alphabetically, with how many of their books
 * the catalogs serve.
 */
const readServedShelves = async ({
  db,
  servedBookIds,
  protectedBookIds,
}: {
  db: createNano.DocumentScope<unknown>
  servedBookIds: ReadonlySet<string>
  protectedBookIds: ReadonlySet<string>
}) => {
  const collections = await find(db, "obokucollection", {
    selector: {},
    fields: ["_id", "books", "metadata"],
  })

  return collections
    .flatMap(function toServedShelf(collection) {
      const bookCount = toServedShelfBookIds({
        shelfBookIds: collection.books,
        servedBookIds,
        protectedBookIds,
      }).length
      const isShelfListed = bookCount > 0

      return isShelfListed
        ? [{ id: collection._id, title: toShelfTitle(collection), bookCount }]
        : []
    })
    .toSorted(compareByTitle)
}

/** The books an owner's OPDS servers serve, and their files. */
@Injectable()
export class OpdsBooksService {
  private readonly logger = new Logger(OpdsBooksService.name)

  constructor(
    private readonly couchService: CouchService,
    private readonly googleConnectionService: GoogleConnectionService,
    private readonly pluginsService: PluginsService,
    private readonly coversService: CoversService,
  ) {}

  /**
   * A page of the books the owner's catalogs serve, in the library's order:
   * none while the owner has no usable Google connection.
   *
   * @param page 1-based.
   * @throws `NotFoundException` for a page past the last; the first always
   * exists, empty or not.
   */
  async listServedBooks({
    owner,
    page,
  }: {
    owner: Pick<UserPostgresEntity, "id" | "couchName">
    page: number
  }) {
    const library = await this.findServedLibrary(owner)
    const servedPage = toCatalogPage(library?.summaries ?? [], page)

    if (!servedPage) throw new NotFoundException()

    const pageIds = servedPage.items.map(({ _id }) => _id)

    return {
      books: library ? await fetchByIds(library.db, "book", pageIds) : [],
      page: servedPage.page,
    }
  }

  /**
   * A page of the shelves the owner's catalogs list, alphabetically, as the
   * app's Shelves tab: every collection, whatever its type, but those holding
   * a book under a protected tag and those with no served book. None while
   * the owner has no usable Google connection.
   *
   * @param page 1-based.
   * @throws `NotFoundException` for a page past the last; the first always
   * exists, empty or not.
   */
  async listServedShelves({
    owner,
    page,
  }: {
    owner: Pick<UserPostgresEntity, "id" | "couchName">
    page: number
  }) {
    const library = await this.findServedLibrary(owner)
    const shelves = library
      ? await readServedShelves({
          db: library.db,
          servedBookIds: new Set(library.summaries.map(({ _id }) => _id)),
          protectedBookIds: library.protectedBookIds,
        })
      : []
    const servedPage = toCatalogPage(shelves, page)

    if (!servedPage) throw new NotFoundException()

    return { shelves: servedPage.items, page: servedPage.page }
  }

  /**
   * A page of a listed shelf's served books, alphabetically, as the app
   * sorts a shelf.
   *
   * @param page 1-based.
   * @throws `NotFoundException` for a shelf the catalogs do not list, or a
   * page past the last.
   */
  async listServedShelfBooks({
    owner,
    shelfId,
    page,
  }: {
    owner: Pick<UserPostgresEntity, "id" | "couchName">
    shelfId: string
    page: number
  }) {
    const library = await this.findServedLibrary(owner)

    if (!library) throw new NotFoundException()

    const collection = await findOne(
      "obokucollection",
      { selector: { _id: shelfId } },
      { db: library.db },
    )
    const shelfBookIds = collection
      ? toServedShelfBookIds({
          shelfBookIds: collection.books,
          servedBookIds: new Set(library.summaries.map(({ _id }) => _id)),
          protectedBookIds: library.protectedBookIds,
        })
      : []
    const isShelfListed = !!collection && shelfBookIds.length > 0

    if (!isShelfListed) throw new NotFoundException()

    const books = await fetchByIds(library.db, "book", shelfBookIds)
    const booksByTitle = books
      .map((book) => ({ id: book._id, title: toServedTitle(book), book }))
      .toSorted(compareByTitle)
      .map(({ book }) => book)
    const servedPage = toCatalogPage(booksByTitle, page)

    if (!servedPage) throw new NotFoundException()

    return {
      shelf: { id: collection._id, title: toShelfTitle(collection) },
      books: servedPage.items,
      page: servedPage.page,
    }
  }

  /**
   * Streams the file of a book the owner's catalogs serve, from Google Drive,
   * as Drive sends it. `size` is the length Drive's download states, none
   * when Drive compresses it; `expectedSize` falls back to the size Drive's
   * file metadata states, an estimate only: the file can change between the
   * two requests.
   *
   * @throws `NotFoundException` for a book the catalogs do not serve, an
   * owner without a usable Google connection, or a file Drive refuses;
   * `ServiceUnavailableException` while Drive rate-limits;
   * `BadGatewayException` for any other failure of Google.
   */
  async streamServedBook({
    owner,
    bookId,
  }: {
    owner: Pick<UserPostgresEntity, "id" | "couchName">
    bookId: string
  }) {
    const { book, firstLink } = await this.findServedBook({ owner, bookId })
    const providerCredentials = {
      access_token: await this.mintDriveAccessToken(owner.id),
    }
    const { pluginsService } = this

    // Drive's answer about the file tells a file the token cannot read from a
    // limit, which a refused download cannot: see `toDriveFailure`.
    const { bookMetadata } = await this.askDrive(
      { bookId, isFileReadable: false },
      function checkFileReadable() {
        return pluginsService.getFileMetadata({
          link: firstLink,
          providerCredentials,
        })
      },
    )

    const { stream, size } = await this.askDrive(
      { bookId, isFileReadable: true },
      function requestDriveStream() {
        return pluginsService.download({ link: firstLink, providerCredentials })
      },
    )
    const metadataSize = toByteCount(bookMetadata?.size)

    return {
      ...toServedFile(book),
      stream,
      size,
      expectedSize: size ?? metadataSize,
    }
  }

  /**
   * The cover of a book the owner's catalogs serve, as a JPEG: its stored
   * cover, else the placeholder the app shows. Covers do not count towards the
   * download quotas.
   *
   * @throws `NotFoundException` for a book the catalogs do not serve, or an
   * owner without a usable Google connection, whose catalogs list no books.
   */
  async deliverServedBookCover({
    owner,
    bookId,
  }: {
    owner: Pick<UserPostgresEntity, "id" | "couchName">
    bookId: string
  }) {
    const isLibraryServed = await this.googleConnectionService.isConnected(
      owner.id,
    )

    if (!isLibraryServed) throw new NotFoundException()

    const { couchName } = await this.findServedBook({ owner, bookId })
    const coverKey = getBookCoverKey(emailToNameHex(couchName), bookId)

    return lastValueFrom(
      this.coversService.deliverCover(coverKey, SERVED_COVER_TYPE),
    )
  }

  /**
   * A book the owner's catalogs serve, with its Drive link, from the owner's
   * library, whose CouchDB user name also keys the book's cover.
   *
   * @throws `NotFoundException` for an owner without a CouchDB user name, or a
   * book the catalogs do not serve.
   */
  private async findServedBook({
    owner,
    bookId,
  }: {
    owner: Pick<UserPostgresEntity, "couchName">
    bookId: string
  }) {
    const { couchName } = owner

    if (!couchName) throw new NotFoundException()

    const db = await this.couchService.createNanoInstanceForUser({
      email: couchName,
    })
    const [book, protectedTagIds] = await Promise.all([
      findOne("book", { selector: { _id: bookId } }, { db }),
      findProtectedTagIds(db),
    ])
    const firstLinkId = book?.links[0]
    const firstLink = firstLinkId
      ? await findOne("link", { selector: { _id: firstLinkId } }, { db })
      : null

    const isFirstLinkOnDrive = firstLink?.type === SERVED_LINK_TYPE

    if (
      !book ||
      !isFirstLinkOnDrive ||
      !isBookShown({ book, protectedTagIds })
    ) {
      throw new NotFoundException()
    }

    return { couchName, book, firstLink }
  }

  /**
   * The owner's library as the catalogs serve it, none while the owner has no
   * usable Google connection or no CouchDB user name yet.
   */
  private async findServedLibrary(
    owner: Pick<UserPostgresEntity, "id" | "couchName">,
  ) {
    const { couchName } = owner
    const isLibraryServed =
      !!couchName && (await this.googleConnectionService.isConnected(owner.id))

    if (!isLibraryServed) return undefined

    const db = await this.couchService.createNanoInstanceForUser({
      email: couchName,
    })

    return { db, ...(await readServedLibrary(db)) }
  }

  /** Runs a request to Drive, turning its refusal into what a reading app gets. */
  private async askDrive<TAnswer>(
    { bookId, isFileReadable }: { bookId: string; isFileReadable: boolean },
    request: () => Promise<TAnswer>,
  ) {
    try {
      return await request()
    } catch (error) {
      const refusal = toDriveRefusal(error)

      this.logger.warn(
        `Drive refused book ${bookId}: status ${refusal.status ?? "none"}, reason ${refusal.reason ?? "none"}`,
      )

      throw toDriveFailure({ refusal, isFileReadable })
    }
  }

  /** An owner without a usable connection gets no Drive books, as from a catalog that does not serve them. */
  private async mintDriveAccessToken(userId: number) {
    try {
      const { accessToken } =
        await this.googleConnectionService.mintAccessToken(userId)

      return accessToken
    } catch (error) {
      const isConnectionUnusable = error instanceof BadRequestException

      if (isConnectionUnusable) throw new NotFoundException()

      this.logger.warn(
        `Minting a Drive token failed: ${error instanceof Error ? error.message : "unknown error"}`,
      )

      throw new BadGatewayException()
    }
  }
}
