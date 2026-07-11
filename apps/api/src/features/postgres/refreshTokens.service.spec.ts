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
      findOne: jest.Mock
      find: jest.Mock
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
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
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
      publicKey: '{"kty":"EC"}',
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
      public_key: '{"kty":"EC"}',
      token_hash: hash(token),
      superseded_at: null,
    })
  })

  it("locks the installation chain before wiping it so an in-flight rotation cannot outlive the re-login", async () => {
    const operations: string[] = []
    repository.manager.find.mockImplementation(
      async function recordChainLock() {
        operations.push("lock")
        return []
      },
    )
    repository.manager.delete.mockImplementation(
      async function recordChainWipe() {
        operations.push("delete")
      },
    )
    const insertBuilder = createQueryBuilderMock({
      raw: [{ id: 1, user_id: 1, installation_id: "installation-1" }],
    })
    repository.manager.createQueryBuilder.mockImplementation(
      function recordInsert() {
        operations.push("insert")
        return insertBuilder
      },
    )

    await service.issueTokenForInstallation({
      userId: 1,
      installationId: "installation-1",
      publicKey: '{"kty":"EC"}',
    })

    expect(repository.manager.find).toHaveBeenCalledWith(
      RefreshTokenPostgresEntity,
      {
        where: { user_id: 1, installation_id: "installation-1" },
        lock: { mode: "pessimistic_write" },
      },
    )
    expect(operations).toEqual(["lock", "delete", "insert"])
  })

  it("persists the sign-in public key on the issued token", async () => {
    const insertBuilder = createQueryBuilderMock({
      raw: [{ id: 1, user_id: 1, installation_id: "installation-1" }],
    })
    repository.manager.createQueryBuilder.mockReturnValue(insertBuilder)

    await service.issueTokenForInstallation({
      userId: 1,
      installationId: "installation-1",
      publicKey: '{"kty":"EC","crv":"P-256"}',
    })

    expect(insertBuilder.values).toHaveBeenCalledWith(
      expect.objectContaining({
        public_key: '{"kty":"EC","crv":"P-256"}',
      }),
    )
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

    const casBuilder = createQueryBuilderMock({ affected: 1 })
    const insertBuilder = createQueryBuilderMock({ raw: [successorRow] })
    repository.manager.createQueryBuilder
      .mockReturnValueOnce(casBuilder)
      .mockReturnValueOnce(insertBuilder)

    const result = await service.rotateForRefresh(activeRow)

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
      public_key: null,
      token_hash: hash(result.refreshToken),
      superseded_at: null,
    })
    expect(repository.manager.createQueryBuilder).toHaveBeenCalledTimes(2)
    expect(repository.createQueryBuilder).not.toHaveBeenCalled()
  })

  it("carries the bound public key over to the successor on rotation", async () => {
    const activeRow = {
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      token_hash: hash("current-token"),
      created_at: new Date(FIXED_NOW.getTime() - ONE_DAY_MS),
      superseded_at: null,
      successor_token: null,
      public_key: '{"kty":"EC","crv":"P-256"}',
    } as RefreshTokenPostgresEntity

    const casBuilder = createQueryBuilderMock({ affected: 1 })
    const insertBuilder = createQueryBuilderMock({ raw: [{ id: 8 }] })
    repository.manager.createQueryBuilder
      .mockReturnValueOnce(casBuilder)
      .mockReturnValueOnce(insertBuilder)

    await service.rotateForRefresh(activeRow)

    expect(insertBuilder.values).toHaveBeenCalledWith(
      expect.objectContaining({
        public_key: '{"kty":"EC","crv":"P-256"}',
      }),
    )
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

    repository.findOne.mockResolvedValueOnce(rotatedRow)
    const casBuilder = createQueryBuilderMock({ affected: 0 })
    repository.manager.createQueryBuilder.mockReturnValueOnce(casBuilder)

    const result = await service.rotateForRefresh(presentedRow)

    expect(result).toEqual({
      status: "rotated",
      session: rotatedRow,
      refreshToken: winnerToken,
    })
    expect(repository.manager.createQueryBuilder).toHaveBeenCalledTimes(1)
    expect(repository.createQueryBuilder).not.toHaveBeenCalled()
  })

  it("rejects the refresh instead of resurrecting the chain when the row is deleted mid-rotation", async () => {
    // The refresh loads an active token, then the row is deleted underneath it
    // (a concurrent re-login wipe or an admin revoke) before the CAS commits.
    // The CAS loses (affected 0) and resolveSuccessor re-reads the row as gone.
    // The session was destroyed on purpose, so we must reject — never mint a
    // fresh active token, which would resurrect the chain revoke/re-login meant
    // to kill.
    const presentedRow = {
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      token_hash: hash("current-token"),
      created_at: new Date(FIXED_NOW.getTime() - ONE_DAY_MS),
      superseded_at: null,
      successor_token: null,
    } as RefreshTokenPostgresEntity

    // gone by the time resolveSuccessor re-reads
    repository.findOne.mockResolvedValueOnce(null)
    const casBuilder = createQueryBuilderMock({ affected: 0 })
    repository.manager.createQueryBuilder.mockReturnValueOnce(casBuilder)

    const result = await service.rotateForRefresh(presentedRow)

    expect(result).toEqual({ status: "invalid" })
    expect(repository.manager.createQueryBuilder).toHaveBeenCalledTimes(1)
    // No resurrection: the autocommit insert path must never run for a deleted chain.
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

    const result = await service.rotateForRefresh(supersededRow)

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

    const result = await service.rotateForRefresh(supersededRow)

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
      public_key: null,
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
      .mockResolvedValueOnce(persistedRow)
    const casBuilder = createQueryBuilderMock({ affected: 0 })
    repository.manager.createQueryBuilder.mockReturnValueOnce(casBuilder)

    const result = await service.rotateForRefresh(supersededRow)

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

    await expect(service.rotateForRefresh(supersededRow)).resolves.toEqual({
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

  it("returns invalid for a token older than the max age (per-token cap)", async () => {
    const agedRow = {
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      token_hash: hash("aged-token"),
      created_at: new Date(FIXED_NOW.getTime() - SIX_MONTHS_MS - 1000),
      superseded_at: null,
    } as RefreshTokenPostgresEntity

    await expect(service.rotateForRefresh(agedRow)).resolves.toEqual({
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

  it("revokes the whole installation chain from any token of the chain, locking it against in-flight rotations", async () => {
    const supersededRow = {
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      token_hash: hash("stale-token"),
      created_at: new Date(FIXED_NOW.getTime() - ONE_DAY_MS),
      superseded_at: new Date(FIXED_NOW.getTime() - 10 * 60 * 1000),
      successor_token: null,
    } as RefreshTokenPostgresEntity

    repository.manager.findOne.mockResolvedValue(supersededRow)

    const chainOperations: string[] = []
    repository.manager.find.mockImplementation(
      async function recordChainLock() {
        chainOperations.push("lock")
        return [supersededRow]
      },
    )
    repository.manager.delete.mockImplementation(
      async function recordChainDelete() {
        chainOperations.push("delete")
      },
    )

    await service.revokeByToken("stale-token")

    expect(repository.manager.transaction).toHaveBeenCalledTimes(1)
    expect(repository.manager.findOne).toHaveBeenCalledWith(
      RefreshTokenPostgresEntity,
      {
        where: { token_hash: hash("stale-token") },
      },
    )
    expect(repository.manager.find).toHaveBeenCalledWith(
      RefreshTokenPostgresEntity,
      {
        where: { user_id: 42, installation_id: "installation-1" },
        lock: { mode: "pessimistic_write" },
      },
    )
    expect(repository.manager.delete).toHaveBeenCalledWith(
      RefreshTokenPostgresEntity,
      {
        user_id: 42,
        installation_id: "installation-1",
      },
    )
    expect(chainOperations).toEqual(["lock", "delete"])
  })

  it("leaves a chain re-issued by a re-login while revocation was acquiring locks", async () => {
    const oldTombstoneRow = {
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      token_hash: hash("stale-token"),
      created_at: new Date(FIXED_NOW.getTime() - ONE_DAY_MS),
      superseded_at: null,
      successor_token: null,
    } as RefreshTokenPostgresEntity
    const freshLoginRow = {
      id: 8,
      user_id: 42,
      installation_id: "installation-1",
      token_hash: hash("fresh-login-token"),
      created_at: FIXED_NOW,
      superseded_at: null,
      successor_token: null,
    } as RefreshTokenPostgresEntity

    repository.manager.findOne.mockResolvedValue(oldTombstoneRow)
    repository.manager.find.mockResolvedValue([freshLoginRow])

    await service.revokeByToken("stale-token")

    expect(repository.manager.find).toHaveBeenCalledWith(
      RefreshTokenPostgresEntity,
      {
        where: { user_id: 42, installation_id: "installation-1" },
        lock: { mode: "pessimistic_write" },
      },
    )
    expect(repository.manager.delete).not.toHaveBeenCalled()
  })

  it("treats revocation of an unknown token as a no-op", async () => {
    repository.manager.findOne.mockResolvedValue(null)

    await expect(
      service.revokeByToken("unknown-token"),
    ).resolves.toBeUndefined()

    expect(repository.manager.delete).not.toHaveBeenCalled()
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
