import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { ObokuErrorCode } from "@oboku/shared"
import type { KoreaderSyncConnectionPostgresEntity } from "../../features/postgres/entities.js"
import { KoreaderSyncConnectionPostgresService } from "../../features/postgres/koreader-sync-connection-postgres.service.js"
import {
  fromSyncTimestamp,
  KOREADER_SYNC_AUTHORIZE_ROUTE,
  KOREADER_SYNC_PROGRESS_ROUTE,
  toSyncDeviceId,
  toSyncFields,
  toSyncKey,
  toSyncPercentage,
  toSyncProgress,
} from "../protocol.js"
import { isNonPublicAddressError } from "../../http/publicAddress.js"
import { KoreaderSyncConnectionKeyCipher } from "./connection-key-cipher.js"
import type {
  KoreaderSyncConnectionDto,
  KoreaderSyncPositionDto,
  PushKoreaderSyncPositionDto,
} from "./koreader-sync-connection.dto.js"
import {
  type KoreaderSyncServerResponse,
  KoreaderSyncServerUnreachableError,
  requestKoreaderSyncServer,
} from "./koreader-sync-client.js"

const HTTP_OK = 200
const UNAUTHORIZED_STATUSES = [401, 403]

/** The `device` oboku pushes positions as, which KOReader shows. */
const OBOKU_DEVICE_NAME = "oboku"

const createConnectionError = (code: ObokuErrorCode) =>
  new BadRequestException({ errors: [{ code }] })

const toConnectionError = (error: unknown) => {
  if (isNonPublicAddressError(error)) {
    return createConnectionError(ObokuErrorCode.ERROR_ADDRESS_NOT_ALLOWED)
  }

  if (error instanceof KoreaderSyncServerUnreachableError) {
    return createConnectionError(
      ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNREACHABLE,
    )
  }

  return error
}

const toKoreaderSyncConnection = (
  connection: KoreaderSyncConnectionPostgresEntity,
): KoreaderSyncConnectionDto => ({
  serverUrl: connection.server_url,
  username: connection.username,
  connectedAt: connection.connected_at.toISOString(),
})

/**
 * What a server answers to a pull: no position when the answer has no
 * progress or percentage, as koreader-sync-server's `{}` for a document it
 * keeps nothing for.
 */
const toPulledPosition = (body: unknown): KoreaderSyncPositionDto | null => {
  const fields = toSyncFields(body)
  const progress = toSyncProgress(fields.progress)
  const percentage = toSyncPercentage(fields.percentage)
  const isPositionKept = progress !== undefined && percentage !== undefined

  if (!isPositionKept) return null

  const { device, timestamp } = fields
  const hasTimestamp =
    typeof timestamp === "number" && Number.isFinite(timestamp)

  return {
    progress,
    percentage,
    device: typeof device === "string" ? device : null,
    deviceId: toSyncDeviceId(fields.device_id) ?? null,
    updatedAt: hasTimestamp ? fromSyncTimestamp(timestamp).toISOString() : null,
  }
}

/** `https://sync.example.com/` and `https://sync.example.com` are one server. */
const normalizeServerUrl = (serverUrl: string) =>
  serverUrl.trim().replace(/\/+$/, "")

/** The KOReader sync server a user connects oboku's reader to. */
@Injectable()
export class KoreaderSyncConnectionService {
  constructor(
    private readonly connectionPostgresService: KoreaderSyncConnectionPostgresService,
    private readonly keyCipher: KoreaderSyncConnectionKeyCipher,
  ) {}

  async find(userId: number) {
    const connection = await this.connectionPostgresService.findByUserId(userId)

    return connection ? toKoreaderSyncConnection(connection) : null
  }

  /**
   * Signs in to the server with `password`, then keeps the key KOReader sync
   * clients derive from it, encrypted. The password itself is not kept.
   */
  async connect({
    userId,
    serverUrl,
    username,
    password,
  }: {
    userId: number
    serverUrl: string
    username: string
    password: string
  }) {
    const normalizedServerUrl = normalizeServerUrl(serverUrl)
    const key = toSyncKey(password)

    await this.requestServer({
      serverUrl: normalizedServerUrl,
      username,
      key,
      route: KOREADER_SYNC_AUTHORIZE_ROUTE,
      method: "GET",
    })

    await this.connectionPostgresService.save({
      userId,
      serverUrl: normalizedServerUrl,
      username,
      encryptedKey: await this.keyCipher.encrypt(key),
    })

    return this.find(userId)
  }

  disconnect(userId: number) {
    return this.connectionPostgresService.deleteByUserId(userId)
  }

  /** Pushes a position the way KOReader does, as the device "oboku". */
  async pushPosition({
    userId,
    position,
  }: {
    userId: number
    position: PushKoreaderSyncPositionDto
  }) {
    await this.requestServer({
      ...(await this.getServerCredentials(userId)),
      route: KOREADER_SYNC_PROGRESS_ROUTE,
      method: "PUT",
      body: {
        document: position.document,
        progress: position.progress,
        percentage: position.percentage,
        device: OBOKU_DEVICE_NAME,
        device_id: position.deviceId,
      },
    })
  }

  async pullPosition({
    userId,
    document,
  }: {
    userId: number
    document: string
  }) {
    const body = await this.requestServer({
      ...(await this.getServerCredentials(userId)),
      route: `${KOREADER_SYNC_PROGRESS_ROUTE}/${encodeURIComponent(document)}`,
      method: "GET",
    })

    return toPulledPosition(body)
  }

  private async getServerCredentials(userId: number) {
    const connection = await this.connectionPostgresService.findByUserId(userId)

    if (!connection) {
      throw new NotFoundException("No KOReader sync server connected")
    }

    const key = await this.keyCipher.decrypt(connection.encrypted_key)
    const canSignIn = key !== null

    if (!canSignIn) {
      throw createConnectionError(
        ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNAUTHORIZED,
      )
    }

    return {
      serverUrl: connection.server_url,
      username: connection.username,
      key,
    }
  }

  /** @returns the body of the server's answer once it says the request succeeded. */
  private async requestServer(
    request: Parameters<typeof requestKoreaderSyncServer>[0],
  ) {
    let response: KoreaderSyncServerResponse

    try {
      response = await requestKoreaderSyncServer(request)
    } catch (error) {
      throw toConnectionError(error)
    }

    const isCredentialRefused = UNAUTHORIZED_STATUSES.includes(response.status)

    if (isCredentialRefused) {
      throw createConnectionError(
        ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNAUTHORIZED,
      )
    }

    const didSucceed = response.status === HTTP_OK

    if (!didSucceed) {
      throw createConnectionError(
        ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNREACHABLE,
      )
    }

    return response.body
  }
}
