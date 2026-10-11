import { BadRequestException, Injectable } from "@nestjs/common"
import { type KoreaderSyncConnection, ObokuErrorCode } from "@oboku/shared"
import { AppConfigService } from "../config/AppConfigService.js"
import type { KoreaderSyncConnectionPostgresEntity } from "../features/postgres/entities.js"
import { KoreaderSyncConnectionPostgresService } from "../features/postgres/koreader-sync-connection-postgres.service.js"
import { toSyncKey } from "../koreader-sync-server/credentials.js"
import { NonPublicAddressError } from "../lib/http/publicAddress.js"
import { KoreaderSyncConnectionKeyCipher } from "./connection-key-cipher.js"
import {
  type KoreaderSyncServerResponse,
  KoreaderSyncServerUnreachableError,
  requestKoreaderSyncServer,
} from "./koreader-sync-client.js"

const HTTP_OK = 200
const UNAUTHORIZED_STATUSES = [401, 403]

const createConnectionError = (code: ObokuErrorCode) =>
  new BadRequestException({ errors: [{ code }] })

const toConnectionError = (error: unknown) => {
  if (error instanceof NonPublicAddressError) {
    return createConnectionError(
      ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_ADDRESS_NOT_ALLOWED,
    )
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
): KoreaderSyncConnection => ({
  serverUrl: connection.server_url,
  username: connection.username,
  connectedAt: connection.connected_at.toISOString(),
})

/** `https://sync.example.com/` and `https://sync.example.com` are one server. */
const normalizeServerUrl = (serverUrl: string) =>
  serverUrl.trim().replace(/\/+$/, "")

/** The KOReader sync server a user connects oboku's reader to. */
@Injectable()
export class KoreaderSyncConnectionService {
  constructor(
    private readonly connectionPostgresService: KoreaderSyncConnectionPostgresService,
    private readonly keyCipher: KoreaderSyncConnectionKeyCipher,
    private readonly appConfig: AppConfigService,
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

    await this.authorize({ serverUrl: normalizedServerUrl, username, key })

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

  private async authorize({
    serverUrl,
    username,
    key,
  }: {
    serverUrl: string
    username: string
    key: string
  }) {
    let response: KoreaderSyncServerResponse

    try {
      response = await requestKoreaderSyncServer({
        serverUrl,
        path: "/users/auth",
        method: "GET",
        username,
        key,
        allowNonPublicAddress:
          this.appConfig.KOREADER_SYNC_ALLOW_PRIVATE_NETWORK,
      })
    } catch (error) {
      throw toConnectionError(error)
    }

    const isCredentialRefused = UNAUTHORIZED_STATUSES.includes(response.status)

    if (isCredentialRefused) {
      throw createConnectionError(
        ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNAUTHORIZED,
      )
    }

    const isSignedIn = response.status === HTTP_OK

    if (!isSignedIn) {
      throw createConnectionError(
        ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNREACHABLE,
      )
    }
  }
}
