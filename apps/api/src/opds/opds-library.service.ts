import { Readable } from "node:stream"
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common"
import { CouchService } from "../couch/couch.service.js"
import { findOne } from "../couch/findOne.js"
import { findProtectedTagIds } from "../couch/findProtectedTagIds.js"
import type { UserPostgresEntity } from "../features/postgres/entities.js"
import { PluginsService } from "../plugins/plugins.service.js"
import { GoogleConnectionService } from "../provider-connections/google/google-connection.service.js"
import { isServedBook, SERVED_LINK_TYPE, toServedFile } from "./opds-library.js"

/** Drive's reasons for a 403 that a later request may not get. */
const DRIVE_RATE_LIMIT_REASONS: ReadonlyArray<string> = [
  "rateLimitExceeded",
  "userRateLimitExceeded",
]

const isObject = (value: unknown): value is object =>
  typeof value === "object" && value !== null

/** The status Drive answered a refused request with, and its first error's reason. */
const toDriveRefusal = (error: unknown) => {
  const response =
    isObject(error) && "response" in error ? error.response : undefined
  const status =
    isObject(response) && "status" in response ? response.status : undefined
  const body =
    isObject(response) && "data" in response ? response.data : undefined
  const driveError = isObject(body) && "error" in body ? body.error : undefined
  const errors =
    isObject(driveError) && "errors" in driveError
      ? driveError.errors
      : undefined
  const firstError: unknown = Array.isArray(errors) ? errors[0] : undefined
  const reason =
    isObject(firstError) && "reason" in firstError
      ? firstError.reason
      : undefined

  return {
    status: typeof status === "number" ? status : undefined,
    reason: typeof reason === "string" ? reason : undefined,
  }
}

/**
 * What a reading app gets for a file Drive would not send. A 401 would read
 * as wrong catalog credentials, so Drive's refusals never answer one, and
 * gaxios's error, whose config carries the access token, stays here.
 */
const toDriveFailure = ({
  status,
  reason,
}: ReturnType<typeof toDriveRefusal>) => {
  const isRateLimited =
    status === 429 ||
    (status === 403 &&
      reason !== undefined &&
      DRIVE_RATE_LIMIT_REASONS.includes(reason))
  const isFileUnreachable = status === 404 || status === 403

  if (isRateLimited) return new ServiceUnavailableException()

  if (isFileUnreachable) return new NotFoundException()

  return new BadGatewayException()
}

/** The books an owner's OPDS servers serve, and their files. */
@Injectable()
export class OpdsLibraryService {
  private readonly logger = new Logger(OpdsLibraryService.name)

  constructor(
    private readonly couchService: CouchService,
    private readonly googleConnectionService: GoogleConnectionService,
    private readonly pluginsService: PluginsService,
  ) {}

  /**
   * Opens the file of a book the owner's catalogs serve, from Google Drive.
   *
   * @throws `NotFoundException` for a book the catalogs do not serve, an
   * owner without a usable Google connection, or a file Drive refuses;
   * `ServiceUnavailableException` while Drive rate-limits;
   * `BadGatewayException` for any other failure of Google.
   */
  async openServedFile({
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

    if (
      !book ||
      firstLink?.type !== SERVED_LINK_TYPE ||
      !isServedBook({ book, firstLinkType: firstLink.type, protectedTagIds })
    ) {
      throw new NotFoundException()
    }

    const providerCredentials = {
      access_token: await this.mintDriveAccessToken(owner.id),
    }

    try {
      const { bookMetadata } = await this.pluginsService.getFileMetadata({
        link: firstLink,
        providerCredentials,
      })
      const { stream } = await this.pluginsService.download({
        link: firstLink,
        providerCredentials,
      })
      const size = Number(bookMetadata?.size)

      return {
        ...toServedFile(book),
        stream: stream instanceof Readable ? stream : Readable.from(stream),
        size: Number.isSafeInteger(size) ? size : undefined,
      }
    } catch (error) {
      const refusal = toDriveRefusal(error)

      this.logger.warn(
        `Drive refused book ${bookId}: status ${refusal.status ?? "none"}, reason ${refusal.reason ?? "none"}`,
      )

      throw toDriveFailure(refusal)
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
