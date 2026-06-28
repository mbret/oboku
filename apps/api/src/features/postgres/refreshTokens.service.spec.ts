import { Logger } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { createHash } from "node:crypto"
import { AppConfigService } from "../../config/AppConfigService"
import { RefreshTokenPostgresEntity } from "./entities"
import { RefreshTokensService } from "./refreshTokens.service"

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000
const FIVE_MINUTES_MS = 5 * 60 * 1000
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const FIXED_NOW = new Date("2026-06-28T12:00:00.000Z")

const hash = (token: string) => createHash("sha256").update(token).digest("hex")

const createQueryBuilderMock = (executeResult: unknown) => {
  const qb: Record<string, jest.Mock> = {}

  for (const method of [
    "update",
    "set",
    "where",
    "andWhere",
    "orWhere",
    "insert",
    "into",
    "values",
    "returning",
    "delete",
    "from",
  ]) {
    qb[method] = jest.fn().mockReturnValue(qb)
  }

  qb.execute = jest.fn().mockResolvedValue(executeResult)

  return qb
}

describe("RefreshTokensService", () => {
  let service: RefreshTokensService
  let repository: {
    findOne: jest.Mock
    insert: jest.Mock
    delete: jest.Mock
    createQueryBuilder: jest.Mock
    manager: {
      transaction: jest.Mock
      createQueryBuilder: jest.Mock
      delete: jest.Mock
    }
  }

  beforeEach(async () => {
    repository = {
      findOne: jest.fn().mockResolvedValue(null),
      insert: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(),
      manager: {
        transaction: jest.fn(),
        createQueryBuilder: jest.fn(),
        delete: jest.fn().mockResolvedValue(undefined),
      },
    }
    repository.manager.transaction.mockImplementation(
      (runInTransaction: (manager: unknown) => unknown) =>
        runInTransaction(repository.manager),
    )

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokensService,
        {
          provide: getRepositoryToken(RefreshTokenPostgresEntity),
          useValue: repository,
        },
        {
          provide: AppConfigService,
          useValue: {
            SECURITY_REFRESH_TOKEN_TTL_MS: SIX_MONTHS_MS,
            SECURITY_REFRESH_TOKEN_ROTATION_GRACE_MS: FIVE_MINUTES_MS,
          },
        },
      ],
    }).compile()

    service = module.get<RefreshTokensService>(RefreshTokensService)

    jest.useFakeTimers()
    jest.setSystemTime(FIXED_NOW)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("issues a fresh token, dropping any prior chain for the installation", async () => {
    const insertBuilder = createQueryBuilderMock({
      raw: [{ id: 1, user_id: 1, installation_id: "installation-1" }],
    })
    repository.manager.createQueryBuilder.mockReturnValue(insertBuilder)

    const token = await service.issueTokenForInstallation({
      userId: 1,
      installationId: "installation-1",
    })

    expect(typeof token).toBe("string")
    expect(token.length).toBeGreaterThan(0)

    expect(repository.manager.delete).toHaveBeenCalledWith(
      RefreshTokenPostgresEntity,
      {
        user_id: 1,
        installation_id: "installation-1",
      },
    )
    expect(insertBuilder.values).toHaveBeenCalledWith({
      user_id: 1,
      installation_id: "installation-1",
      token_hash: hash(token),
      superseded_at: null,
    })
  })

  it("rotates an active token: wins the CAS, stores the encrypted successor, and inserts it", async () => {
    const activeRow = {
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      token_hash: hash("current-token"),
      created_at: new Date(FIXED_NOW.getTime() - ONE_DAY_MS),
      superseded_at: null,
      successor_token: null,
    } as RefreshTokenPostgresEntity
    const successorRow = {
      id: 8,
      user_id: 42,
      installation_id: "installation-1",
      created_at: FIXED_NOW,
      superseded_at: null,
    } as RefreshTokenPostgresEntity

    repository.findOne.mockResolvedValue(activeRow)
    const casBuilder = createQueryBuilderMock({ affected: 1 })
    const insertBuilder = createQueryBuilderMock({ raw: [successorRow] })
    repository.manager.createQueryBuilder
      .mockReturnValueOnce(casBuilder)
      .mockReturnValueOnce(insertBuilder)

    const result = await service.rotateForRefresh("current-token")

    expect(result).toEqual({
      status: "rotated",
      session: successorRow,
      refreshToken: expect.any(String),
    })
    if (result.status !== "rotated") throw new Error("expected rotated")
    expect(result.refreshToken).not.toBe("current-token")

    expect(repository.manager.transaction).toHaveBeenCalledTimes(1)
    expect(casBuilder.set).toHaveBeenCalledWith({
      superseded_at: FIXED_NOW,
      successor_token: expect.any(String),
    })
    expect(casBuilder.where).toHaveBeenCalledWith(
      "token_hash = :presentedHash",
      {
        presentedHash: hash("current-token"),
      },
    )
    expect(casBuilder.andWhere).toHaveBeenCalledWith(
      "superseded_at IS NULL",
      {},
    )

    expect(insertBuilder.values).toHaveBeenCalledWith({
      user_id: 42,
      installation_id: "installation-1",
      token_hash: hash(result.refreshToken),
      superseded_at: null,
    })
    expect(repository.manager.createQueryBuilder).toHaveBeenCalledTimes(2)
    expect(repository.createQueryBuilder).not.toHaveBeenCalled()
  })

  it("converges on the stored successor when it loses the CAS to a concurrent refresh", async () => {
    const winnerToken = "winner-token"
    const presentedRow = {
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      token_hash: hash("current-token"),
      created_at: new Date(FIXED_NOW.getTime() - ONE_DAY_MS),
      superseded_at: null,
      successor_token: null,
    } as RefreshTokenPostgresEntity
    const rotatedRow = {
      ...presentedRow,
      superseded_at: FIXED_NOW,
      successor_token: service["encryptSuccessor"](winnerToken),
    } as RefreshTokenPostgresEntity

    repository.findOne
      .mockResolvedValueOnce(presentedRow)
      .mockResolvedValueOnce(rotatedRow)
    const casBuilder = createQueryBuilderMock({ affected: 0 })
    repository.manager.createQueryBuilder.mockReturnValueOnce(casBuilder)

    const result = await service.rotateForRefresh("current-token")

    expect(result).toEqual({
      status: "rotated",
      session: rotatedRow,
      refreshToken: winnerToken,
    })
    expect(repository.manager.createQueryBuilder).toHaveBeenCalledTimes(1)
    expect(repository.createQueryBuilder).not.toHaveBeenCalled()
  })

  it("returns the same successor for a grace-window retry, minting nothing new", async () => {
    const successorToken = "grace-successor"
    const supersededRow = {
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      token_hash: hash("superseded-token"),
      created_at: new Date(FIXED_NOW.getTime() - ONE_DAY_MS),
      superseded_at: new Date(FIXED_NOW.getTime() - 60 * 1000),
      successor_token: service["encryptSuccessor"](successorToken),
    } as RefreshTokenPostgresEntity

    repository.findOne.mockResolvedValue(supersededRow)

    const result = await service.rotateForRefresh("superseded-token")

    expect(result).toEqual({
      status: "rotated",
      session: supersededRow,
      refreshToken: successorToken,
    })
    expect(repository.createQueryBuilder).not.toHaveBeenCalled()
  })

  it("falls back to a fresh successor in the grace window when the stored one cannot be decrypted", async () => {
    const supersededRow = {
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      token_hash: hash("superseded-token"),
      created_at: new Date(FIXED_NOW.getTime() - ONE_DAY_MS),
      superseded_at: new Date(FIXED_NOW.getTime() - 60 * 1000),
      successor_token: null,
    } as RefreshTokenPostgresEntity
    const successorRow = {
      id: 9,
      user_id: 42,
      installation_id: "installation-1",
      created_at: FIXED_NOW,
      superseded_at: null,
    } as RefreshTokenPostgresEntity

    repository.findOne.mockResolvedValue(supersededRow)
    const casBuilder = createQueryBuilderMock({ affected: 1 })
    const insertBuilder = createQueryBuilderMock({ raw: [successorRow] })
    repository.manager.createQueryBuilder
      .mockReturnValueOnce(casBuilder)
      .mockReturnValueOnce(insertBuilder)

    const result = await service.rotateForRefresh("superseded-token")

    expect(result.status).toBe("rotated")
    if (result.status !== "rotated") throw new Error("expected rotated")
    expect(result.session).toBe(successorRow)
    expect(result.refreshToken).not.toBe("superseded-token")

    expect(repository.manager.transaction).toHaveBeenCalledTimes(1)
    expect(casBuilder.set).toHaveBeenCalledWith({
      successor_token: expect.any(String),
    })
    expect(casBuilder.where).toHaveBeenCalledWith(
      "token_hash = :presentedHash",
      { presentedHash: hash("superseded-token") },
    )
    expect(casBuilder.andWhere).toHaveBeenCalledWith(
      "successor_token IS NOT DISTINCT FROM :expectedSuccessorToken",
      { expectedSuccessorToken: null },
    )
    expect(insertBuilder.values).toHaveBeenCalledWith({
      user_id: 42,
      installation_id: "installation-1",
      token_hash: hash(result.refreshToken),
      superseded_at: null,
    })
    expect(repository.createQueryBuilder).not.toHaveBeenCalled()
  })

  it("converges on a single fallback successor across grace retries when the parent is later read back", async () => {
    const winnerToken = "fallback-winner"
    const supersededRow = {
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      token_hash: hash("superseded-token"),
      created_at: new Date(FIXED_NOW.getTime() - ONE_DAY_MS),
      superseded_at: new Date(FIXED_NOW.getTime() - 60 * 1000),
      successor_token: null,
    } as RefreshTokenPostgresEntity
    const persistedRow = {
      ...supersededRow,
      successor_token: service["encryptSuccessor"](winnerToken),
    } as RefreshTokenPostgresEntity

    repository.findOne
      .mockResolvedValueOnce(supersededRow)
      .mockResolvedValueOnce(supersededRow)
      .mockResolvedValueOnce(persistedRow)
    const casBuilder = createQueryBuilderMock({ affected: 0 })
    repository.manager.createQueryBuilder.mockReturnValueOnce(casBuilder)

    const result = await service.rotateForRefresh("superseded-token")

    expect(result).toEqual({
      status: "rotated",
      session: persistedRow,
      refreshToken: winnerToken,
    })
    expect(repository.manager.createQueryBuilder).toHaveBeenCalledTimes(1)
    expect(repository.createQueryBuilder).not.toHaveBeenCalled()
  })

  it("flags reuse for a superseded token presented past the grace window but leaves the rest of the chain intact", async () => {
    const warnSpy = jest
      .spyOn(Logger.prototype, "warn")
      .mockImplementation(() => undefined)

    const supersededRow = {
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      token_hash: hash("replayed-token"),
      created_at: new Date(FIXED_NOW.getTime() - ONE_DAY_MS),
      superseded_at: new Date(FIXED_NOW.getTime() - 10 * 60 * 1000),
      successor_token: service["encryptSuccessor"]("stale-successor"),
    } as RefreshTokenPostgresEntity

    repository.findOne.mockResolvedValue(supersededRow)

    await expect(service.rotateForRefresh("replayed-token")).resolves.toEqual({
      status: "reuse",
    })

    // The stale token is refused, but the chain must NOT be revoked: the active
    // token and any concurrent siblings keep working so an erratic / offline
    // client replaying an old token is never logged out as collateral.
    expect(repository.delete).not.toHaveBeenCalled()
    expect(repository.manager.delete).not.toHaveBeenCalled()
    expect(repository.createQueryBuilder).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  it("returns invalid for an unknown token", async () => {
    repository.findOne.mockResolvedValue(null)

    await expect(service.rotateForRefresh("unknown-token")).resolves.toEqual({
      status: "invalid",
    })

    expect(repository.createQueryBuilder).not.toHaveBeenCalled()
  })

  it("returns invalid for a token older than the max age (per-token cap)", async () => {
    const agedRow = {
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      token_hash: hash("aged-token"),
      created_at: new Date(FIXED_NOW.getTime() - SIX_MONTHS_MS - 1000),
      superseded_at: null,
    } as RefreshTokenPostgresEntity

    repository.findOne.mockResolvedValue(agedRow)

    await expect(service.rotateForRefresh("aged-token")).resolves.toEqual({
      status: "invalid",
    })

    expect(repository.createQueryBuilder).not.toHaveBeenCalled()
  })

  it("deletes expired tokens and superseded tokens past their grace window", async () => {
    const qb = createQueryBuilderMock({ affected: 2 })
    repository.createQueryBuilder.mockReturnValue(qb)

    await service.deleteStaleSessions()

    expect(qb.where).toHaveBeenCalledWith("created_at < :expiryCutoff", {
      expiryCutoff: new Date(FIXED_NOW.getTime() - SIX_MONTHS_MS),
    })
    expect(qb.orWhere).toHaveBeenCalledWith("superseded_at < :graceCutoff", {
      graceCutoff: new Date(FIXED_NOW.getTime() - FIVE_MINUTES_MS),
    })
  })

  it("revokes a single token by id", async () => {
    await service.deleteById(7)

    expect(repository.delete).toHaveBeenCalledWith(7)
  })

  it("revokes every token for a user", async () => {
    await service.deleteByUserId(42)

    expect(repository.delete).toHaveBeenCalledWith({ user_id: 42 })
  })

  it("round-trips a successor token and rejects tampered or wrong-key payloads", () => {
    const encrypt = (instance: RefreshTokensService, token: string) =>
      instance["encryptSuccessor"](token)
    const decrypt = (instance: RefreshTokensService, payload: string) =>
      instance["decryptSuccessor"](payload)

    const payload = encrypt(service, "successor-token")
    expect(decrypt(service, payload)).toBe("successor-token")

    const tampered = Buffer.from(payload, "base64")
    const lastIndex = tampered.length - 1
    tampered.writeUInt8(tampered.readUInt8(lastIndex) ^ 0xff, lastIndex)
    expect(decrypt(service, tampered.toString("base64"))).toBeNull()

    expect(decrypt(service, "not-valid-base64-payload")).toBeNull()

    const otherInstance = new RefreshTokensService(
      repository as never,
      { SECURITY_REFRESH_TOKEN_TTL_MS: SIX_MONTHS_MS } as never,
    )
    const wrongKeyPayload = encrypt(otherInstance, "successor-token")
    expect(decrypt(service, wrongKeyPayload)).toBeNull()
  })
})
