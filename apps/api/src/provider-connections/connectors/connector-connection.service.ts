import { isDeepStrictEqual } from "node:util"
import { BadRequestException, Injectable, Logger } from "@nestjs/common"
import { CONNECTABLE_CONNECTOR_TYPES, ObokuErrorCode } from "@oboku/shared"
import { CouchService } from "../../couch/couch.service.js"
import { fetchByIds, getSettings } from "../../couch/dbHelpers.js"
import { createObokuBadRequest } from "../../http/obokuBadRequest.js"
import { isNonPublicAddressError } from "../../http/publicAddress.js"
import {
  isPasswordRefused,
  isSignInRefused,
  signInToWebdav,
} from "../../plugins/webdav/index.js"
import { streamWebdavFile } from "../../plugins/webdav/streamWebdavFile.js"
import {
  type EncryptedSecretValue,
  ProviderConnectionsService,
  type StoredConnection,
} from "../provider-connections.service.js"
import type {
  ConnectorConnectionDto,
  ConnectorConnectionStatus,
} from "./connector-connection.dto.js"

const SIGN_IN_DEADLINE_MS = 10_000

/** A failure of a connector's server, or of the request to it, as its `cause`. */
export class ConnectorServerError extends Error {
  constructor(cause: unknown) {
    super("The connector's server did not send the file", { cause })
  }
}

const toSignInError = (error: unknown) => {
  if (isNonPublicAddressError(error)) {
    return createObokuBadRequest(ObokuErrorCode.ERROR_ADDRESS_NOT_ALLOWED)
  }

  return createObokuBadRequest(
    isSignInRefused(error)
      ? ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SIGN_IN_REFUSED
      : ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SERVER_UNREACHABLE,
  )
}

type UserDb = Awaited<ReturnType<CouchService["createNanoInstanceForUser"]>>

const readConnectors = async (db: UserDb) => {
  const settings = await getSettings(db)

  return settings?.connectors ?? []
}

/** The value of each secret the user's database holds, by id. */
const readSecretValues = async (
  db: UserDb,
  secretIds: ReadonlyArray<string>,
) => {
  const secrets = await fetchByIds(db, "secret", secretIds)

  return new Map<string, EncryptedSecretValue | null>(
    secrets.map((secret) => [secret._id, secret.value ?? null]),
  )
}

const toConnectorConnection = ({
  connectorId,
  status,
  storedConnection,
}: {
  connectorId: string
  status: ConnectorConnectionStatus
  storedConnection: Pick<StoredConnection, "connectedAt">
}): ConnectorConnectionDto => ({
  connectorId,
  status,
  connectedAt: storedConnection.connectedAt.toISOString(),
})

/**
 * The connectors whose password a user lets the API keep. Each connection
 * keeps the connector as it was when the user connected it, and the API only
 * uses the password while the connector still matches it.
 */
@Injectable()
export class ConnectorConnectionService {
  private readonly logger = new Logger(ConnectorConnectionService.name)

  constructor(
    private readonly couchService: CouchService,
    private readonly providerConnectionsService: ProviderConnectionsService,
  ) {}

  private async listStoredConnections(userId: number) {
    const { providerConnectionsService } = this
    const connectionsByType = await Promise.all(
      CONNECTABLE_CONNECTOR_TYPES.map(
        async function listConnectionsOfType(provider) {
          return providerConnectionsService.list({ userId, provider })
        },
      ),
    )

    return connectionsByType.flat()
  }

  /**
   * Signs in to the connector's server with `password`, then keeps a copy of
   * the connector and of its password secret's encrypted value, with the
   * password, encrypted. Replaces the connector's previous connection.
   */
  async connect({
    userId,
    email,
    connectorId,
    password,
  }: {
    userId: number
    email: string
    connectorId: string
    password: string
  }): Promise<ConnectorConnectionDto> {
    const db = await this.couchService.createNanoInstanceForUser({ email })
    const connectors = await readConnectors(db)
    const connector = connectors.find(({ id }) => id === connectorId)
    const secretValues = await readSecretValues(
      db,
      connector ? [connector.passwordAsSecretId] : [],
    )
    const passwordSecretValue = connector
      ? secretValues.get(connector.passwordAsSecretId)
      : undefined
    const isPasswordSecretStored = passwordSecretValue !== undefined

    if (!connector || !isPasswordSecretStored) {
      throw createObokuBadRequest(
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_CONNECTOR_NOT_FOUND,
      )
    }

    if (connector.type !== "webdav") {
      throw new BadRequestException(
        `A ${connector.type} connector cannot be connected`,
      )
    }

    try {
      await signInToWebdav({
        connector,
        password,
        signal: AbortSignal.timeout(SIGN_IN_DEADLINE_MS),
      })
    } catch (error) {
      throw toSignInError(error)
    }

    await this.providerConnectionsService.connect({
      userId,
      provider: connector.type,
      credentials: { connector, passwordSecretValue, password },
      accountId: connector.id,
      accountName: connector.url,
      scopes: [],
    })

    const storedConnections = await this.listStoredConnections(userId)
    const storedConnection = storedConnections.find(
      ({ accountId }) => accountId === connector.id,
    )

    if (!storedConnection) {
      throw new Error("The connector's connection was not kept")
    }

    return toConnectorConnection({
      connectorId: connector.id,
      status: "connected",
      storedConnection,
    })
  }

  /**
   * Each of the user's connector connections, with its credentials, and
   * whether its connector and its password secret's value still match the
   * copies kept when connecting. Deletes a connection whose connector or
   * password secret no longer exists, or whose credentials no longer
   * decrypt, and returns none for it.
   */
  private async readConnections({
    userId,
    email,
  }: {
    userId: number
    email: string
  }) {
    const storedConnections = await this.listStoredConnections(userId)

    if (storedConnections.length === 0) return []

    const { providerConnectionsService } = this
    const db = await this.couchService.createNanoInstanceForUser({ email })
    const connectors = await readConnectors(db)
    const secretValues = await readSecretValues(
      db,
      connectors.map(({ passwordAsSecretId }) => passwordAsSecretId),
    )
    const connections = await Promise.all(
      storedConnections.map(
        async function toCurrentConnection(storedConnection) {
          const { provider, accountId: connectorId } = storedConnection
          const credentials =
            await providerConnectionsService.getCredentials(storedConnection)
          const connector = connectors.find(
            ({ id, type }) => id === connectorId && type === provider,
          )
          const passwordSecretValue = connector
            ? secretValues.get(connector.passwordAsSecretId)
            : undefined
          const isPasswordSecretStored = passwordSecretValue !== undefined

          if (!credentials || !connector || !isPasswordSecretStored) {
            await providerConnectionsService.disconnectIfUnchanged(
              storedConnection,
            )

            return null
          }

          const isUnchangedSinceConnected =
            isDeepStrictEqual(credentials.connector, connector) &&
            isDeepStrictEqual(
              credentials.passwordSecretValue,
              passwordSecretValue,
            )
          const status: ConnectorConnectionStatus = isUnchangedSinceConnected
            ? "connected"
            : "connector-changed"

          return { storedConnection, connectorId, status, credentials }
        },
      ),
    )

    return connections.filter((connection) => connection !== null)
  }

  /**
   * The user's connector connections. A connection whose connector or
   * password secret no longer exists, or whose credentials no longer decrypt,
   * is deleted.
   */
  async list({
    userId,
    email,
  }: {
    userId: number
    email: string
  }): Promise<ConnectorConnectionDto[]> {
    const connections = await this.readConnections({ userId, email })

    return connections.map(toConnectorConnection)
  }

  /**
   * The ids of the connectors the user connected that still match the copies
   * kept when connecting. Deletes connections as `list` does.
   */
  async listConnectedIds({ userId, email }: { userId: number; email: string }) {
    const connections = await this.readConnections({ userId, email })

    return connections
      .filter(({ status }) => status === "connected")
      .map(({ connectorId }) => connectorId)
  }

  /**
   * Streams a file from the server of a connector the user connected, with
   * the password the API keeps. It reaches the server through the connector
   * as it was when connected, never the settings' connector, so the password
   * only goes to the address and username it was connected with. None while
   * the connector is not connected, or changed since. A server that refuses
   * the password (401) loses its connection, as a lost Google connection
   * does: the user connects the connector again.
   *
   * @throws `ConnectorServerError` for an error of `streamWebdavFile`; the
   * errors of the reads and writes of connections and settings as they come.
   */
  async streamConnectedFile({
    userId,
    email,
    connectorId,
    filePath,
  }: {
    userId: number
    email: string
    connectorId: string
    filePath: string
  }) {
    const connections = await this.readConnections({ userId, email })
    const connection = connections.find(
      ({ connectorId: id, status }) =>
        id === connectorId && status === "connected",
    )

    if (!connection) return null

    const { connector, password } = connection.credentials

    try {
      return await streamWebdavFile({ connector, password, filePath })
    } catch (error) {
      const isDisconnected =
        isPasswordRefused(error) &&
        (await this.providerConnectionsService.disconnectIfUnchanged(
          connection.storedConnection,
        ))

      if (isDisconnected) {
        this.logger.warn(
          `Disconnected connector ${connectorId} of user ${userId}: its WebDAV server refused the password`,
        )
      }

      throw new ConnectorServerError(error)
    }
  }

  async disconnect({
    userId,
    connectorId,
  }: {
    userId: number
    connectorId: string
  }) {
    await Promise.all(
      CONNECTABLE_CONNECTOR_TYPES.map((provider) =>
        this.providerConnectionsService.disconnect({
          userId,
          provider,
          accountId: connectorId,
        }),
      ),
    )
  }
}
