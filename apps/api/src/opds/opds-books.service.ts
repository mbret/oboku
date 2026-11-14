import { Readable } from "node:stream"
import type createNano from "nano"
import type { BookDocType } from "@oboku/shared"
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common"
import { CouchService } from "../couch/couch.service.js"
import { fetchByIds, find } from "../couch/dbHelpers.js"
import { findOne } from "../couch/findOne.js"
import { findProtectedTagIds } from "../couch/findProtectedTagIds.js"
import type { UserPostgresEntity } from "../features/postgres/entities.js"
import { PluginsService } from "../plugins/plugins.service.js"
import { GoogleConnectionService } from "../provider-connections/google/google-connection.service.js"
import { toGoogleApiFailure } from "../http/googleApiFailure.js"
import { isRecord } from "../http/isRecord.js"
import {
  compareNewestFirst,
  isBookShown,
  SERVED_BOOKS_PAGE_SIZE,
  SERVED_LINK_TYPE,
  toServedFile,
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

/** The summaries of the books the catalogs serve, in the library's order. */
const findServedBookSummaries = async (
  db: createNano.DocumentScope<unknown>,
) => {
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

  return summaries
    .filter(function isServedBook(book) {
      const firstLinkId = book.links[0]
      const isFirstLinkOnDrive =
        firstLinkId !== undefined && driveLinkIds.has(firstLinkId)

      return isFirstLinkOnDrive && isBookShown({ book, protectedTagIds })
    })
    .toSorted(compareNewestFirst)
}

/** The books an owner's OPDS servers serve, and their files. */
@Injectable()
export class OpdsBooksService {
  private readonly logger = new Logger(OpdsBooksService.name)

  constructor(
    private readonly couchService: CouchService,
    private readonly googleConnectionService: GoogleConnectionService,
    private readonly pluginsService: PluginsService,
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
    const { couchName } = owner
    const isLibraryServed =
      !!couchName && (await this.googleConnectionService.isConnected(owner.id))
    const db = isLibraryServed
      ? await this.couchService.createNanoInstanceForUser({ email: couchName })
      : undefined
    const summaries = db ? await findServedBookSummaries(db) : []
    const total = summaries.length
    const firstIndex = (page - 1) * SERVED_BOOKS_PAGE_SIZE
    const isPastLastPage = page > 1 && firstIndex >= total

    if (isPastLastPage) throw new NotFoundException()

    const pageIds = summaries
      .slice(firstIndex, firstIndex + SERVED_BOOKS_PAGE_SIZE)
      .map(({ _id }) => _id)

    return {
      books: db ? await fetchByIds(db, "book", pageIds) : [],
      page: { number: page, size: SERVED_BOOKS_PAGE_SIZE, total },
    }
  }

  /**
   * Streams the file of a book the owner's catalogs serve, from Google Drive,
   * as Drive sends it.
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

    const providerCredentials = {
      access_token: await this.mintDriveAccessToken(owner.id),
    }
    const { pluginsService } = this

    // Drive's answer about the file tells a file the token cannot read from a
    // limit, which a refused download cannot: see `toDriveFailure`.
    await this.askDrive(
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

    return {
      ...toServedFile(book),
      stream: stream instanceof Readable ? stream : Readable.from(stream),
      size,
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
