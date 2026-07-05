import { BadRequestException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { Test, TestingModule } from "@nestjs/testing"
import { ObokuErrorCode } from "@oboku/shared"
import { AppConfigService } from "src/config/AppConfigService"
import { SecretsService } from "src/config/SecretsService"
import { CouchService } from "src/couch/couch.service"
import { EmailService } from "src/email/EmailService"
import { RefreshTokensService } from "src/features/postgres/refreshTokens.service"
import { UsersService } from "../users/users.service"
import { AuthService } from "./auth.service"
import { RefreshProofService } from "./refresh-proof.service"

describe("AuthService", () => {
  let service: AuthService
  let usersService: {
    findUserByEmail: jest.Mock
    findUserById: jest.Mock
    registerUser: jest.Mock
    saveUser: jest.Mock
    deleteAccount: jest.Mock
  }
  let couchService: {
    generateUserJWT: jest.Mock
  }
  let jwtService: {
    signAsync: jest.Mock
    verifyAsync: jest.Mock
    decode: jest.Mock
  }
  let refreshTokensService: {
    issueTokenForInstallation: jest.Mock
    findByToken: jest.Mock
    rotateForRefresh: jest.Mock
    deleteById: jest.Mock
    revokeByToken: jest.Mock
  }
  let refreshProofService: {
    isProofValid: jest.Mock
  }
  let emailService: {
    getSignUpLink: jest.Mock
    sendSignUpLink: jest.Mock
    sendMagicLink: jest.Mock
  }

  beforeEach(async () => {
    usersService = {
      findUserByEmail: jest.fn(),
      findUserById: jest.fn(),
      registerUser: jest.fn(),
      saveUser: jest.fn(),
      deleteAccount: jest.fn().mockResolvedValue(undefined),
    }
    couchService = {
      generateUserJWT: jest.fn(),
    }
    jwtService = {
      signAsync: jest.fn().mockResolvedValue("signup-token"),
      verifyAsync: jest.fn(),
      decode: jest.fn(),
    }
    refreshTokensService = {
      issueTokenForInstallation: jest.fn(),
      findByToken: jest.fn(),
      rotateForRefresh: jest.fn(),
      deleteById: jest.fn().mockResolvedValue(undefined),
      revokeByToken: jest.fn().mockResolvedValue(undefined),
    }
    refreshProofService = {
      isProofValid: jest.fn(),
    }
    emailService = {
      getSignUpLink: jest
        .fn()
        .mockReturnValue(
          "https://app.example.com/signup/complete?token=signup-token",
        ),
      sendSignUpLink: jest.fn(),
      sendMagicLink: jest.fn(),
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
            getJwtPrivateKey: jest.fn().mockResolvedValue("private-key"),
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

  it("revokes the presented refresh session on logout", async () => {
    await service.logout({ refreshToken: "refresh-token" })

    expect(refreshTokensService.revokeByToken).toHaveBeenCalledWith(
      "refresh-token",
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
    refreshTokensService.issueTokenForInstallation.mockResolvedValue(
      "refresh-token",
    )

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

  it("registers the sign-in public key with the issued refresh session", async () => {
    couchService.generateUserJWT.mockResolvedValue("access-token")
    refreshTokensService.issueTokenForInstallation.mockResolvedValue(
      "refresh-token",
    )

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
})
