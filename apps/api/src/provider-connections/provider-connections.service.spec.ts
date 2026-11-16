import { Test } from "@nestjs/testing"
import { SecretsService } from "../config/SecretsService.js"
import {
  AtRestCipher,
  PROVIDER_CONNECTION_CREDENTIALS_PURPOSE,
} from "../crypto/at-rest-cipher.js"
import { ProviderConnectionPostgresService } from "../features/postgres/provider-connection-postgres.service.js"
import {
  createConnectionStore,
  toConnectionRowKey,
} from "./provider-connection-store.fixture.js"
import { ProviderConnectionsService } from "./provider-connections.service.js"

const READER_ID = 1
const OTHER_READER_ID = 2
const REFRESH_TOKEN = "1//refresh-token"

const GOOGLE_CONNECTION: {
  provider: "google"
  credentials: { refreshToken: string }
  accountId: string
  accountName: string
  scopes: string[]
} = {
  provider: "google",
  credentials: { refreshToken: REFRESH_TOKEN },
  accountId: "google-sub",
  accountName: "reader@gmail.com",
  scopes: ["https://www.googleapis.com/auth/drive.file"],
}

const READER_GOOGLE_KEY: {
  userId: number
  provider: "google"
  accountId: string
} = {
  userId: READER_ID,
  provider: "google",
  accountId: GOOGLE_CONNECTION.accountId,
}

const OTHER_GOOGLE_ACCOUNT = {
  accountId: "other-google-sub",
  accountName: "reader@work.example",
}

const createService = async () => {
  const { rows, store } = createConnectionStore()
  const module = await Test.createTestingModule({
    providers: [
      ProviderConnectionsService,
      AtRestCipher,
      { provide: ProviderConnectionPostgresService, useValue: store },
      {
        provide: SecretsService,
        useValue: { getJwtPrivateKey: async () => "jwt-private-key" },
      },
    ],
  }).compile()

  return {
    rows,
    service: module.get(ProviderConnectionsService),
    atRestCipher: module.get(AtRestCipher),
  }
}

describe("ProviderConnectionsService", () => {
  it("gives back the credentials it kept, encrypted", async () => {
    const { rows, service } = await createService()

    await service.connect({ userId: READER_ID, ...GOOGLE_CONNECTION })

    await expect(service.getCredentials(READER_GOOGLE_KEY)).resolves.toEqual({
      refreshToken: REFRESH_TOKEN,
    })
    expect(JSON.stringify([...rows.values()]).includes(REFRESH_TOKEN)).toBe(
      false,
    )
  })

  it("lists the connections without their credentials", async () => {
    const { service } = await createService()

    await service.connect({ userId: READER_ID, ...GOOGLE_CONNECTION })

    const connections = await service.list({
      userId: READER_ID,
      provider: "google",
    })

    expect(connections).toEqual([
      {
        accountId: "google-sub",
        accountName: "reader@gmail.com",
        scopes: ["https://www.googleapis.com/auth/drive.file"],
        connectedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
    ])
  })

  it("replaces the credentials when the user connects the same account again", async () => {
    const { rows, service } = await createService()

    await service.connect({ userId: READER_ID, ...GOOGLE_CONNECTION })
    await service.connect({
      userId: READER_ID,
      ...GOOGLE_CONNECTION,
      credentials: { refreshToken: "new-refresh-token" },
    })

    expect(rows.size).toBe(1)
    await expect(service.getCredentials(READER_GOOGLE_KEY)).resolves.toEqual({
      refreshToken: "new-refresh-token",
    })
  })

  it("keeps a connection per account of the same provider", async () => {
    const { service } = await createService()
    const otherAccountKey = {
      ...READER_GOOGLE_KEY,
      accountId: OTHER_GOOGLE_ACCOUNT.accountId,
    }

    await service.connect({ userId: READER_ID, ...GOOGLE_CONNECTION })
    await service.connect({
      userId: READER_ID,
      ...GOOGLE_CONNECTION,
      ...OTHER_GOOGLE_ACCOUNT,
      credentials: { refreshToken: "other-refresh-token" },
    })

    await expect(service.getCredentials(otherAccountKey)).resolves.toEqual({
      refreshToken: "other-refresh-token",
    })

    await service.disconnect(otherAccountKey)

    await expect(service.getCredentials(otherAccountKey)).resolves.toBeNull()
    await expect(service.getCredentials(READER_GOOGLE_KEY)).resolves.toEqual({
      refreshToken: REFRESH_TOKEN,
    })
  })

  it("deletes the provider's other accounts when the connection replaces them", async () => {
    const { service } = await createService()

    await service.connect({ userId: READER_ID, ...GOOGLE_CONNECTION })
    await service.connect({
      userId: READER_ID,
      ...GOOGLE_CONNECTION,
      ...OTHER_GOOGLE_ACCOUNT,
      replacesOtherAccounts: true,
    })

    const connections = await service.list({
      userId: READER_ID,
      provider: "google",
    })

    expect(connections.map(({ accountId }) => accountId)).toEqual([
      OTHER_GOOGLE_ACCOUNT.accountId,
    ])
  })

  it("refuses credentials that are not the provider's shape", async () => {
    const { rows, service, atRestCipher } = await createService()

    await service.connect({ userId: READER_ID, ...GOOGLE_CONNECTION })

    const readerRow = rows.get(toConnectionRowKey(READER_GOOGLE_KEY))

    if (!readerRow) throw new Error("The connection was not saved")

    readerRow.encrypted_credentials = await atRestCipher.encrypt({
      purpose: PROVIDER_CONNECTION_CREDENTIALS_PURPOSE,
      plaintext: JSON.stringify({ accessToken: "access-token" }),
      associatedData: `${READER_ID}:google:${GOOGLE_CONNECTION.accountId}`,
    })

    await expect(service.getCredentials(READER_GOOGLE_KEY)).resolves.toBeNull()
  })

  it("refuses credentials copied into another user's connection", async () => {
    const { rows, service } = await createService()
    const otherReaderKey = { ...READER_GOOGLE_KEY, userId: OTHER_READER_ID }

    await service.connect({ userId: READER_ID, ...GOOGLE_CONNECTION })
    await service.connect({
      userId: OTHER_READER_ID,
      ...GOOGLE_CONNECTION,
      credentials: { refreshToken: "other-refresh-token" },
    })

    const readerRow = rows.get(toConnectionRowKey(READER_GOOGLE_KEY))
    const otherRow = rows.get(toConnectionRowKey(otherReaderKey))

    if (!readerRow || !otherRow)
      throw new Error("The connections were not saved")

    otherRow.encrypted_credentials = readerRow.encrypted_credentials

    await expect(service.getCredentials(otherReaderKey)).resolves.toBeNull()
  })

  it("refuses credentials copied into the same user's connection to another account", async () => {
    const { rows, service } = await createService()
    const otherAccountKey = {
      ...READER_GOOGLE_KEY,
      accountId: OTHER_GOOGLE_ACCOUNT.accountId,
    }

    await service.connect({ userId: READER_ID, ...GOOGLE_CONNECTION })
    await service.connect({
      userId: READER_ID,
      ...GOOGLE_CONNECTION,
      ...OTHER_GOOGLE_ACCOUNT,
      credentials: { refreshToken: "other-refresh-token" },
    })

    const readerRow = rows.get(toConnectionRowKey(READER_GOOGLE_KEY))
    const otherAccountRow = rows.get(toConnectionRowKey(otherAccountKey))

    if (!readerRow || !otherAccountRow)
      throw new Error("The connections were not saved")

    otherAccountRow.encrypted_credentials = readerRow.encrypted_credentials

    await expect(service.getCredentials(otherAccountKey)).resolves.toBeNull()
  })

  it("reads credentials saved while they were bound to the user and provider only", async () => {
    const { rows, service, atRestCipher } = await createService()

    await service.connect({ userId: READER_ID, ...GOOGLE_CONNECTION })

    const readerRow = rows.get(toConnectionRowKey(READER_GOOGLE_KEY))

    if (!readerRow) throw new Error("The connection was not saved")

    readerRow.encrypted_credentials = await atRestCipher.encrypt({
      purpose: PROVIDER_CONNECTION_CREDENTIALS_PURPOSE,
      plaintext: JSON.stringify({ refreshToken: "saved-earlier" }),
      associatedData: `${READER_ID}:google`,
    })

    await expect(service.getCredentials(READER_GOOGLE_KEY)).resolves.toEqual({
      refreshToken: "saved-earlier",
    })
  })

  it("has nothing for a user who never connected, or disconnected", async () => {
    const { service } = await createService()

    await expect(service.getCredentials(READER_GOOGLE_KEY)).resolves.toBeNull()

    await service.connect({ userId: READER_ID, ...GOOGLE_CONNECTION })
    await service.disconnect(READER_GOOGLE_KEY)

    await expect(
      service.list({ userId: READER_ID, provider: "google" }),
    ).resolves.toEqual([])
  })
})
