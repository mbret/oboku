import type createNano from "nano"
import { lastValueFrom } from "rxjs"
import {
  type BookDocType,
  getBookCoverKey,
  isBookProtected,
  type LinkDocTypeForProvider,
  type WebdavConnectorDocType,
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
import { isPasswordRefused, toAnsweredStatus } from "../plugins/webdav/index.js"
import { streamWebdavFile } from "../plugins/webdav/streamWebdavFile.js"
import { ConnectorConnectionService } from "../provider-connections/connectors/connector-connection.service.js"
import { GoogleConnectionService } from "../provider-connections/google/google-connection.service.js"
import { toByteCount } from "../http/contentLength.js"
import { toGoogleApiFailure } from "../http/googleApiFailure.js"
import { isRecord } from "../http/isRecord.js"
import {
  compareByTitle,
  compareNewestFirst,
  isBookShown,
  isLinkServed,
  type LinkConnection,
  SERVED_COVER_TYPE,
  type ServedConnections,
  toCatalogPage,
  toLinkConnection,
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
 * What a reading app gets for a file its provider would not send. A 401
 * would read as wrong catalog credentials, so a provider's refusals never
 * answer one.
 */
const toProviderFailure = ({
  isRateLimited,
  isFileUnreachable,
}: {
  isRateLimited: boolean
  isFileUnreachable: boolean
}) => {
  if (isRateLimited) return new ServiceUnavailableException()

  if (isFileUnreachable) return new NotFoundException()

  return new BadGatewayException()
}

/**
 * What a reading app gets for a file Drive would not send.
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

  return toProviderFailure({ isRateLimited, isFileUnreachable })
}

/** What a reading app gets for a file its WebDAV server would not send. */
const toWebdavFailure = (error: unknown) => {
  const answeredStatus = toAnsweredStatus(error)
  const isRateLimited = answeredStatus === 429
  const isFileUnreachable =
    answeredStatus === 401 || answeredStatus === 403 || answeredStatus === 404

  return toProviderFailure({ isRateLimited, isFileUnreachable })
}

/** The connection a served book's file needs, with what reaching it takes. */
type UsableConnection =
  | Extract<LinkConnection, { provider: "DRIVE" }>
  | (Extract<LinkConnection, { provider: "webdav" }> & {
      /** The connector as connected: the password only goes to its address and username. */
      connector: WebdavConnectorDocType
      password: string
    })

const readServedLinkIds = async ({
  db,
  connections,
}: {
  db: createNano.DocumentScope<unknown>
  connections: ServedConnections
}) => {
  const isAnyConnectorUsable = connections.connectedConnectorIds.size > 0
  const [driveLinks, webdavLinks] = await Promise.all([
    connections.isGoogleConnected
      ? find(db, "link", { selector: { type: "DRIVE" }, fields: ["_id"] })
      : [],
    isAnyConnectorUsable
      ? find(db, "link", {
          selector: { type: "webdav" },
          fields: ["_id", "type", "data"],
        })
      : [],
  ])
  const servedWebdavLinks = webdavLinks.filter((link) =>
    isLinkServed({ link, connections }),
  )

  return new Set([...driveLinks, ...servedWebdavLinks].map(({ _id }) => _id))
}

/**
 * The summaries of the books the catalogs serve, in the library's order, and
 * the ids of every book under a protected tag, served or not.
 */
const readServedLibrary = async ({
  db,
  connections,
}: {
  db: createNano.DocumentScope<unknown>
  connections: ServedConnections
}) => {
  const [protectedTagIds, servedLinkIds, bookSummaries] = await Promise.all([
    findProtectedTagIds(db),
    readServedLinkIds({ db, connections }),
    find(db, "book", {
      selector: {},
      fields: ["_id", "links", "tags", "isNotInterested", "createdAt"],
    }),
  ])
  const summaries: Pick<
    BookDocType,
    "_id" | "links" | "tags" | "isNotInterested" | "createdAt"
  >[] = bookSummaries

  return {
    summaries: summaries
      .filter(function isServedBook(book) {
        const firstLinkId = book.links[0]
        const isFirstLinkServed =
          firstLinkId !== undefined && servedLinkIds.has(firstLinkId)

        return isFirstLinkServed && isBookShown({ book, protectedTagIds })
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
    private readonly connectorConnectionService: ConnectorConnectionService,
    private readonly pluginsService: PluginsService,
    private readonly coversService: CoversService,
  ) {}

  /**
   * A page of the books the owner's catalogs serve, in the library's order:
   * none while the owner has no usable connection.
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
   * the owner has no usable connection.
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
   * Streams the file of a book the owner's catalogs serve, from its provider.
   *
   * @throws `NotFoundException` for a book the catalogs do not serve, a
   * connection that is not usable, or a file the provider refuses;
   * `ServiceUnavailableException` while the provider rate-limits;
   * `BadGatewayException` for any other failure of the provider.
   */
  async streamServedBook({
    owner,
    bookId,
  }: {
    owner: Pick<UserPostgresEntity, "id" | "couchName">
    bookId: string
  }) {
    const { book, connection } = await this.findServedBook({ owner, bookId })

    return connection.provider === "webdav"
      ? this.streamWebdavBook({ owner, book, connection })
      : this.streamDriveBook({ owner, book, link: connection.link })
  }

  /**
   * The cover of a book the owner's catalogs serve, as a JPEG: its stored
   * cover, else the placeholder the app shows. Covers do not count towards the
   * download quotas.
   *
   * @throws `NotFoundException` for a book the catalogs do not serve, such as
   * one whose connection is not usable.
   */
  async deliverServedBookCover({
    owner,
    bookId,
  }: {
    owner: Pick<UserPostgresEntity, "id" | "couchName">
    bookId: string
  }) {
    const { couchName } = await this.findServedBook({ owner, bookId })
    const coverKey = getBookCoverKey(emailToNameHex(couchName), bookId)

    return lastValueFrom(
      this.coversService.deliverCover(coverKey, SERVED_COVER_TYPE),
    )
  }

  /**
   * A book the owner's catalogs serve, with the connection its first link
   * needs, from the owner's library, whose CouchDB user name also keys the
   * book's cover.
   *
   * @throws `NotFoundException` for an owner without a CouchDB user name, or a
   * book the catalogs do not serve.
   */
  private async findServedBook({
    owner,
    bookId,
  }: {
    owner: Pick<UserPostgresEntity, "id" | "couchName">
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
    const linkConnection = firstLink ? toLinkConnection(firstLink) : null
    const connection =
      book && linkConnection && isBookShown({ book, protectedTagIds })
        ? await this.findUsableConnection({ owner, couchName, linkConnection })
        : null

    if (!book || !connection) throw new NotFoundException()

    return { couchName, book, connection }
  }

  private async findUsableConnection({
    owner,
    couchName,
    linkConnection,
  }: {
    owner: Pick<UserPostgresEntity, "id">
    couchName: string
    linkConnection: LinkConnection
  }): Promise<UsableConnection | null> {
    if (linkConnection.provider === "DRIVE") {
      const isGoogleConnected = await this.googleConnectionService.isConnected(
        owner.id,
      )

      return isGoogleConnected ? linkConnection : null
    }

    const credentials =
      await this.connectorConnectionService.findUsableCredentials({
        userId: owner.id,
        email: couchName,
        connectorId: linkConnection.connectorId,
      })

    return credentials ? { ...linkConnection, ...credentials } : null
  }

  private async findServedConnections({
    userId,
    couchName,
  }: {
    userId: number
    couchName: string
  }): Promise<ServedConnections> {
    const [isGoogleConnected, connectedConnectorIds] = await Promise.all([
      this.googleConnectionService.isConnected(userId),
      this.connectorConnectionService.listConnectedIds({
        userId,
        email: couchName,
      }),
    ])

    return {
      isGoogleConnected,
      connectedConnectorIds: new Set(connectedConnectorIds),
    }
  }

  /**
   * The owner's library as the catalogs serve it, none while the owner has no
   * usable connection or no CouchDB user name yet.
   */
  private async findServedLibrary(
    owner: Pick<UserPostgresEntity, "id" | "couchName">,
  ) {
    const { couchName } = owner

    if (!couchName) return undefined

    const connections = await this.findServedConnections({
      userId: owner.id,
      couchName,
    })
    const isAnyConnectionUsable =
      connections.isGoogleConnected ||
      connections.connectedConnectorIds.size > 0

    if (!isAnyConnectionUsable) return undefined

    const db = await this.couchService.createNanoInstanceForUser({
      email: couchName,
    })

    return { db, ...(await readServedLibrary({ db, connections })) }
  }

  /**
   * Streams a book's Google Drive file, as Drive sends it. `size` is the
   * length Drive's download states, none when Drive compresses it;
   * `expectedSize` falls back to the size Drive's file metadata states, an
   * estimate only: the file can change between the two requests.
   */
  private async streamDriveBook({
    owner,
    book,
    link,
  }: {
    owner: Pick<UserPostgresEntity, "id">
    book: Pick<BookDocType, "_id" | "metadata" | "metadataSourcePriority">
    link: LinkDocTypeForProvider<"DRIVE">
  }) {
    const bookId = book._id
    const providerCredentials = {
      access_token: await this.mintDriveAccessToken(owner.id),
    }
    const { pluginsService } = this

    // Drive's answer about the file tells a file the token cannot read from a
    // limit, which a refused download cannot: see `toDriveFailure`.
    const { bookMetadata } = await this.askDrive(
      { bookId, isFileReadable: false },
      function checkFileReadable() {
        return pluginsService.getFileMetadata({ link, providerCredentials })
      },
    )

    const { stream, size } = await this.askDrive(
      { bookId, isFileReadable: true },
      function requestDriveStream() {
        return pluginsService.download({ link, providerCredentials })
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
   * A server that refuses the password (401) loses its connection, as a lost
   * Google connection does: the owner connects the connector again.
   */
  private async streamWebdavBook({
    owner,
    book,
    connection,
  }: {
    owner: Pick<UserPostgresEntity, "id">
    book: Pick<BookDocType, "_id" | "metadata" | "metadataSourcePriority">
    connection: Extract<UsableConnection, { provider: "webdav" }>
  }) {
    const { connector, password, filePath, connectorId } = connection

    try {
      const { stream, statedSize } = await streamWebdavFile({
        connector,
        password,
        filePath,
      })

      return { ...toServedFile(book), stream, expectedSize: statedSize }
    } catch (error) {
      this.logger.warn(
        `Reading book ${book._id} from its WebDAV server failed: status ${toAnsweredStatus(error) ?? "none"}`,
      )

      if (isPasswordRefused(error)) {
        this.logger.warn(
          `Disconnected connector ${connectorId}: its WebDAV server refused the password`,
        )
        await this.connectorConnectionService.disconnect({
          userId: owner.id,
          connectorId,
        })
      }

      throw toWebdavFailure(error)
    }
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
