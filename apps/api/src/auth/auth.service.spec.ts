import type { Mock } from "vitest"
import { BadRequestException } from "@nestjs/common"
import { JwtService, TokenExpiredError } from "@nestjs/jwt"
import { Test, TestingModule } from "@nestjs/testing"
import { ObokuErrorCode } from "@oboku/shared"
import bcrypt from "bcrypt"
import type createNano from "nano"
import { AppConfigService } from "../config/AppConfigService.js"
import { SecretsService } from "../config/SecretsService.js"
import { CouchService, emailToUserDbName } from "../couch/couch.service.js"
import { EmailService } from "../email/EmailService.js"
import { RefreshTokensService } from "../features/postgres/refreshTokens.service.js"
import { UsersService } from "../users/users.service.js"
import { AuthService } from "./auth.service.js"
import { RefreshProofService } from "./refresh-proof.service.js"

vi.mock("../lib/couch/userDbIndexes.js", function mockUserDbIndexes() {
  return {
    ensureUserDbIndexes: vi
      .fn()
      .mockResolvedValue({ created: [], existing: [] }),
  }
})

const readerPasswordHash = bcrypt.hashSync("secret", 4)

const readerSignIn = {
  email: "reader@example.com",
  password: "secret",
  installation_id: "installation-1",
  public_key: { kty: "EC", crv: "P-256", x: "x", y: "y" },
}

const createFakeAdminNano = ({
  userDbExists,
  couchUserName = "reader@example.com",
}: {
  userDbExists: boolean
  couchUserName?: string
}) => {
  const couchUser = {
    _id: `org.couchdb.user:${couchUserName}`,
    _rev: "1-abc",
    name: couchUserName,
    email: couchUserName,
    type: "user",
    roles: [],
  }
  let dbExists = userDbExists

  const usersDb = {
    get: vi.fn(async function getUserDocIfExists(id: string) {
      if (id !== couchUser._id) {
        throw Object.assign(new Error("not_found"), { statusCode: 404 })
      }
      return couchUser
    }),
    find: vi.fn().mockResolvedValue({ docs: [couchUser] }),
    insert: vi.fn(async function recreateDatabaseLikeCouchPeruser() {
      dbExists = true
      return { ok: true, id: couchUser._id, rev: "2-def" }
    }),
  }
  const server = {
    use: vi.fn(function useUsersDb() {
      return usersDb
    }),
    db: {
      get: vi.fn(async function getDatabaseIfExists() {
        if (dbExists) return { db_name: "userdb" }
        throw Object.assign(new Error("not_found"), { statusCode: 404 })
      }),
    },
  }

  return {
    // Only `_users` get/find/insert and `db.get` are exercised; nano's full
    // ServerScope surface is irrelevant to these tests.
    server: server as unknown as createNano.ServerScope,
    usersDb,
    couchUser,
  }
}

describe("AuthService", () => {
  let service: AuthService
  let usersService: {
    findUserByEmail: Mock
    findUserById: Mock
    registerUser: Mock
    saveUser: Mock
    deleteAccount: Mock
  }
  let couchService: {
    generateUserJWT: Mock
    createAdminNanoInstance: Mock
  }
  let jwtService: {
    signAsync: Mock
    verifyAsync: Mock
    decode: Mock
  }
  let refreshTokensService: {
    issueTokenForInstallation: Mock
    findByToken: Mock
    rotateForRefresh: Mock
    deleteById: Mock
    revokeBySessionId: Mock
  }
  let refreshProofService: {
    isProofValid: Mock
  }
  let emailService: {
    getSignUpLink: Mock
    sendSignUpLink: Mock
    sendMagicLink: Mock
  }

  beforeEach(async () => {
    usersService = {
      findUserByEmail: vi.fn(),
      findUserById: vi.fn(),
      registerUser: vi.fn(),
      saveUser: vi.fn(),
      deleteAccount: vi.fn().mockResolvedValue(undefined),
    }
    couchService = {
      generateUserJWT: vi.fn(),
      createAdminNanoInstance: vi.fn(),
    }
    jwtService = {
      signAsync: vi.fn().mockResolvedValue("signup-token"),
      verifyAsync: vi.fn(),
      decode: vi.fn(),
    }
    refreshTokensService = {
      issueTokenForInstallation: vi.fn(),
      findByToken: vi.fn(),
      rotateForRefresh: vi.fn(),
      deleteById: vi.fn().mockResolvedValue(undefined),
      revokeBySessionId: vi.fn().mockResolvedValue(undefined),
    }
    refreshProofService = {
      isProofValid: vi.fn(),
    }
    emailService = {
      getSignUpLink: vi
        .fn()
        .mockReturnValue(
          "https://app.example.com/signup/complete?token=signup-token",
        ),
      sendSignUpLink: vi.fn(),
      sendMagicLink: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: AppConfigService,
          useValue: {},
        },
        {
          provide: CouchService,
          useValue: couchService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: RefreshTokensService,
          useValue: refreshTokensService,
        },
        {
          provide: SecretsService,
          useValue: {
            getJwtPrivateKey: vi.fn().mockResolvedValue("private-key"),
            getJwtPublicKey: vi.fn().mockResolvedValue("public-key"),
          },
        },
        {
          provide: EmailService,
          useValue: emailService,
        },
        {
          provide: RefreshProofService,
          useValue: refreshProofService,
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it("rejects admin-generated sign up links for accounts that already have a password", async () => {
    usersService.findUserByEmail.mockResolvedValue({
      email: "reader@example.com",
      password: "hashed-password",
    })

    let error: unknown

    try {
      await service.generateSignUpLink({
        email: "reader@example.com",
      })
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).toBeInstanceOf(BadRequestException)
    if (!(error instanceof BadRequestException)) {
      throw error
    }

    expect(error.getResponse()).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_ACCOUNT_ALREADY_EXISTS }],
    })

    expect(jwtService.signAsync).not.toHaveBeenCalled()
    expect(emailService.getSignUpLink).not.toHaveBeenCalled()
  })

  it("generates admin sign up links for accounts without a local password", async () => {
    usersService.findUserByEmail.mockResolvedValue({
      email: "reader@example.com",
      password: null,
    })

    await expect(
      service.generateSignUpLink({
        email: "reader@example.com",
        appPublicUrl: "https://app.example.com",
      }),
    ).resolves.toBe(
      "https://app.example.com/signup/complete?token=signup-token",
    )

    expect(jwtService.signAsync).toHaveBeenCalled()
    expect(emailService.getSignUpLink).toHaveBeenCalledWith({
      appPublicUrl: "https://app.example.com",
      token: "signup-token",
    })
  })

  describe.each<{
    method: "verifySignUpToken" | "verifyMagicLinkToken"
    type: "signup" | "magic-link"
    otherType: "signup" | "magic-link"
    invalidErrorCode: ObokuErrorCode
  }>([
    {
      method: "verifySignUpToken",
      type: "signup",
      otherType: "magic-link",
      invalidErrorCode: ObokuErrorCode.ERROR_SIGNUP_LINK_INVALID,
    },
    {
      method: "verifyMagicLinkToken",
      type: "magic-link",
      otherType: "signup",
      invalidErrorCode: ObokuErrorCode.ERROR_MAGIC_LINK_INVALID,
    },
  ])("$method", ({ method, type, otherType, invalidErrorCode }) => {
    it("returns the email of a valid token", async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: "reader@example.com",
        type,
      })

      await expect(service[method]("email-link-token")).resolves.toBe(
        "reader@example.com",
      )

      expect(jwtService.verifyAsync).toHaveBeenCalledWith("email-link-token", {
        publicKey: "public-key",
        algorithms: ["RS256"],
      })
    })

    it("rejects a token of the other type", async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: "reader@example.com",
        type: otherType,
      })

      await expect(service[method]("email-link-token")).rejects.toEqual(
        new BadRequestException({ errors: [{ code: invalidErrorCode }] }),
      )
    })

    it("rejects an expired token", async () => {
      jwtService.verifyAsync.mockRejectedValue(
        new TokenExpiredError("jwt expired", new Date()),
      )

      await expect(service[method]("email-link-token")).rejects.toEqual(
        new BadRequestException({ errors: [{ code: invalidErrorCode }] }),
      )
    })
  })

  it("revokes the session by id on logout", async () => {
    await service.logout({ sessionId: "session-1" })

    expect(refreshTokensService.revokeBySessionId).toHaveBeenCalledWith(
      "session-1",
    )
  })

  it("delegates deleteAccount to UsersService", async () => {
    await service.deleteAccount({ userId: 1, email: "a@b.c" })

    expect(usersService.deleteAccount).toHaveBeenCalledWith({
      userId: 1,
      email: "a@b.c",
    })
  })

  it("issues per-installation refresh sessions when generating tokens", async () => {
    couchService.generateUserJWT.mockResolvedValue("access-token")
    refreshTokensService.issueTokenForInstallation.mockResolvedValue({
      refreshToken: "refresh-token",
      sessionId: "session-1",
    })

    await expect(
      service.generateTokens({
        email: "reader@example.com",
        userId: 1,
        installationId: "installation-1",
        publicKey: '{"kty":"EC"}',
      }),
    ).resolves.toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      sessionId: "session-1",
    })

    expect(couchService.generateUserJWT).toHaveBeenCalledWith({
      email: "reader@example.com",
      userId: 1,
    })
    expect(refreshTokensService.issueTokenForInstallation).toHaveBeenCalledWith(
      {
        userId: 1,
        installationId: "installation-1",
        publicKey: '{"kty":"EC"}',
      },
    )
  })

  it("rotates the refresh token and returns the newly issued one", async () => {
    const presentedRow = {
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      public_key: '{"kty":"EC"}',
      session_id: "session-1",
    }
    refreshTokensService.findByToken.mockResolvedValue(presentedRow)
    refreshProofService.isProofValid.mockResolvedValue(true)
    refreshTokensService.rotateForRefresh.mockResolvedValue({
      status: "rotated",
      session: { id: 7, user_id: 42, installation_id: "installation-1" },
      refreshToken: "rotated-refresh-token",
    })
    usersService.findUserById.mockResolvedValue({
      id: 42,
      email: "reader@example.com",
      couchName: "reader@example.com",
    })
    couchService.generateUserJWT.mockResolvedValue("fresh-access-token")

    await expect(
      service.refreshToken({
        refreshToken: "opaque-refresh-token",
        proof: "valid-proof",
      }),
    ).resolves.toEqual({
      accessToken: "fresh-access-token",
      refreshToken: "rotated-refresh-token",
    })

    expect(refreshTokensService.rotateForRefresh).toHaveBeenCalledWith(
      presentedRow,
    )
    expect(usersService.findUserById).toHaveBeenCalledWith(42)
    expect(couchService.generateUserJWT).toHaveBeenCalledWith({
      email: "reader@example.com",
      userId: 42,
    })
    expect(couchService.createAdminNanoInstance).not.toHaveBeenCalled()
    expect(refreshTokensService.deleteById).not.toHaveBeenCalled()
  })

  it("issues the refreshed access token with the recorded legacy Couch name", async () => {
    refreshTokensService.findByToken.mockResolvedValue({
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      public_key: '{"kty":"EC"}',
      session_id: "session-1",
    })
    refreshProofService.isProofValid.mockResolvedValue(true)
    refreshTokensService.rotateForRefresh.mockResolvedValue({
      status: "rotated",
      session: { id: 7, user_id: 42, installation_id: "installation-1" },
      refreshToken: "rotated-refresh-token",
    })
    usersService.findUserById.mockResolvedValue({
      id: 42,
      email: "reader@example.com",
      couchName: "Reader@Example.com",
    })
    couchService.generateUserJWT.mockResolvedValue("fresh-access-token")

    await service.refreshToken({
      refreshToken: "opaque-refresh-token",
      proof: "valid-proof",
    })

    expect(couchService.generateUserJWT).toHaveBeenCalledWith({
      email: "Reader@Example.com",
      userId: 42,
    })
  })

  it("rejects refresh for an account that has not signed in since couchName was recorded", async () => {
    refreshTokensService.findByToken.mockResolvedValue({
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      public_key: '{"kty":"EC"}',
      session_id: "session-1",
    })
    refreshProofService.isProofValid.mockResolvedValue(true)
    refreshTokensService.rotateForRefresh.mockResolvedValue({
      status: "rotated",
      session: { id: 7, user_id: 42, installation_id: "installation-1" },
      refreshToken: "rotated-refresh-token",
    })
    usersService.findUserById.mockResolvedValue({
      id: 42,
      email: "reader@example.com",
    })

    await expect(
      service.refreshToken({
        refreshToken: "opaque-refresh-token",
        proof: "valid-proof",
      }),
    ).rejects.toThrow()

    expect(couchService.generateUserJWT).not.toHaveBeenCalled()
    expect(refreshTokensService.deleteById).not.toHaveBeenCalled()
  })

  it("rejects refresh with an unknown token before attempting rotation", async () => {
    refreshTokensService.findByToken.mockResolvedValue(null)

    await expect(
      service.refreshToken({ refreshToken: "stale-refresh-token" }),
    ).rejects.toThrow()

    expect(refreshTokensService.rotateForRefresh).not.toHaveBeenCalled()
    expect(usersService.findUserById).not.toHaveBeenCalled()
  })

  it("rejects refresh with an invalid (aged-out) token", async () => {
    refreshTokensService.findByToken.mockResolvedValue({
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      public_key: '{"kty":"EC"}',
      session_id: "session-1",
    })
    refreshProofService.isProofValid.mockResolvedValue(true)
    refreshTokensService.rotateForRefresh.mockResolvedValue({
      status: "invalid",
    })

    await expect(
      service.refreshToken({
        refreshToken: "stale-refresh-token",
        proof: "valid-proof",
      }),
    ).rejects.toThrow()

    expect(usersService.findUserById).not.toHaveBeenCalled()
    expect(refreshTokensService.deleteById).not.toHaveBeenCalled()
  })

  it("removes dangling refresh sessions when the user no longer exists", async () => {
    refreshTokensService.findByToken.mockResolvedValue({
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      public_key: '{"kty":"EC"}',
      session_id: "session-1",
    })
    refreshProofService.isProofValid.mockResolvedValue(true)
    refreshTokensService.rotateForRefresh.mockResolvedValue({
      status: "rotated",
      session: { id: 7, user_id: 42, installation_id: "installation-1" },
      refreshToken: "rotated-refresh-token",
    })
    usersService.findUserById.mockResolvedValue(null)

    await expect(
      service.refreshToken({
        refreshToken: "opaque-refresh-token",
        proof: "valid-proof",
      }),
    ).rejects.toThrow()

    expect(refreshTokensService.deleteById).toHaveBeenCalledWith(7)
  })

  it("rejects refresh of a key-bound session without a proof", async () => {
    refreshTokensService.findByToken.mockResolvedValue({
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      public_key: '{"kty":"EC"}',
    })

    await expect(
      service.refreshToken({ refreshToken: "opaque-refresh-token" }),
    ).rejects.toThrow()

    expect(refreshProofService.isProofValid).not.toHaveBeenCalled()
    expect(refreshTokensService.rotateForRefresh).not.toHaveBeenCalled()
  })

  it("rejects refresh of a key-bound session when the proof does not verify", async () => {
    refreshTokensService.findByToken.mockResolvedValue({
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      public_key: '{"kty":"EC"}',
    })
    refreshProofService.isProofValid.mockResolvedValue(false)

    await expect(
      service.refreshToken({
        refreshToken: "opaque-refresh-token",
        proof: "tampered-proof",
      }),
    ).rejects.toThrow()

    expect(refreshProofService.isProofValid).toHaveBeenCalledWith({
      proof: "tampered-proof",
      boundPublicKey: '{"kty":"EC"}',
    })
    expect(refreshTokensService.rotateForRefresh).not.toHaveBeenCalled()
  })

  it("rejects refresh of an unbound (pre-binding) session even with a proof", async () => {
    refreshTokensService.findByToken.mockResolvedValue({
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      public_key: null,
    })

    await expect(
      service.refreshToken({
        refreshToken: "opaque-refresh-token",
        proof: "valid-proof",
      }),
    ).rejects.toThrow()

    expect(refreshProofService.isProofValid).not.toHaveBeenCalled()
    expect(refreshTokensService.rotateForRefresh).not.toHaveBeenCalled()
  })

  it("rejects refresh of a session with no session id (pre session-scoped logout)", async () => {
    refreshTokensService.findByToken.mockResolvedValue({
      id: 7,
      user_id: 42,
      installation_id: "installation-1",
      public_key: '{"kty":"EC"}',
      session_id: null,
    })
    refreshProofService.isProofValid.mockResolvedValue(true)

    await expect(
      service.refreshToken({
        refreshToken: "legacy-refresh-token",
        proof: "valid-proof",
      }),
    ).rejects.toThrow()

    expect(refreshTokensService.rotateForRefresh).not.toHaveBeenCalled()
  })

  it("registers the sign-in public key with the issued refresh session", async () => {
    couchService.generateUserJWT.mockResolvedValue("access-token")
    refreshTokensService.issueTokenForInstallation.mockResolvedValue({
      refreshToken: "refresh-token",
      sessionId: "session-1",
    })

    await service.generateTokens({
      email: "reader@example.com",
      userId: 1,
      installationId: "installation-1",
      publicKey: '{"kty":"EC","crv":"P-256"}',
    })

    expect(refreshTokensService.issueTokenForInstallation).toHaveBeenCalledWith(
      {
        userId: 1,
        installationId: "installation-1",
        publicKey: '{"kty":"EC","crv":"P-256"}',
      },
    )
  })

  const mockReaderSignInDependencies = ({
    couchName,
  }: {
    couchName?: string
  } = {}) => {
    usersService.findUserByEmail.mockResolvedValue({
      id: 1,
      email: "reader@example.com",
      password: readerPasswordHash,
      emailVerified: true,
      couchName,
    })
    couchService.generateUserJWT.mockResolvedValue("access-token")
    refreshTokensService.issueTokenForInstallation.mockResolvedValue({
      refreshToken: "refresh-token",
      sessionId: "session-1",
    })
  }

  it("signs in an existing user without rewriting their _users doc when their database exists", async () => {
    mockReaderSignInDependencies()
    const { server, usersDb } = createFakeAdminNano({ userDbExists: true })
    couchService.createAdminNanoInstance.mockResolvedValue(server)

    const session = await service.signInWithEmail(readerSignIn)

    expect(usersDb.insert).not.toHaveBeenCalled()
    expect(session.dbName).toBe(emailToUserDbName("reader@example.com"))
  })

  it("recreates a missing user database through couch_peruser before signing in", async () => {
    mockReaderSignInDependencies()
    const { server, usersDb, couchUser } = createFakeAdminNano({
      userDbExists: false,
    })
    couchService.createAdminNanoInstance.mockResolvedValue(server)

    const session = await service.signInWithEmail(readerSignIn)

    expect(usersDb.insert).toHaveBeenCalledWith(couchUser, couchUser._id)
    expect(session.dbName).toBe(emailToUserDbName("reader@example.com"))
  })

  it("records the Couch name on the account at sign-in", async () => {
    mockReaderSignInDependencies()
    const { server } = createFakeAdminNano({ userDbExists: true })
    couchService.createAdminNanoInstance.mockResolvedValue(server)

    await service.signInWithEmail(readerSignIn)

    expect(usersService.saveUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, couchName: "reader@example.com" }),
    )
  })

  it("keeps a legacy account on its original Couch name and database", async () => {
    mockReaderSignInDependencies()
    const { server, usersDb } = createFakeAdminNano({
      userDbExists: true,
      couchUserName: "Reader@Example.com",
    })
    couchService.createAdminNanoInstance.mockResolvedValue(server)

    const session = await service.signInWithEmail(readerSignIn)

    expect(usersDb.insert).not.toHaveBeenCalled()
    expect(session.dbName).toBe(emailToUserDbName("Reader@Example.com"))
    expect(couchService.generateUserJWT).toHaveBeenCalledWith(
      expect.objectContaining({ email: "Reader@Example.com" }),
    )
    expect(usersService.saveUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, couchName: "Reader@Example.com" }),
    )
  })

  it("does not rewrite the account when its Couch name is already recorded", async () => {
    mockReaderSignInDependencies({ couchName: "reader@example.com" })
    const { server } = createFakeAdminNano({ userDbExists: true })
    couchService.createAdminNanoInstance.mockResolvedValue(server)

    await service.signInWithEmail(readerSignIn)

    expect(usersService.saveUser).not.toHaveBeenCalled()
  })
})
