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

describe("AuthService", () => {
  let service: AuthService
  let usersService: {
    findUserByEmail: jest.Mock
    registerUser: jest.Mock
    saveUser: jest.Mock
    deleteAccount: jest.Mock
  }
  let jwtService: {
    signAsync: jest.Mock
    verifyAsync: jest.Mock
    decode: jest.Mock
  }
  let emailService: {
    getSignUpLink: jest.Mock
    sendSignUpLink: jest.Mock
    sendMagicLink: jest.Mock
  }

  beforeEach(async () => {
    usersService = {
      findUserByEmail: jest.fn(),
      registerUser: jest.fn(),
      saveUser: jest.fn(),
      deleteAccount: jest.fn().mockResolvedValue(undefined),
    }
    jwtService = {
      signAsync: jest.fn().mockResolvedValue("signup-token"),
      verifyAsync: jest.fn(),
      decode: jest.fn(),
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
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: RefreshTokensService,
          useValue: {},
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

  it("delegates deleteAccount to UsersService", async () => {
    await service.deleteAccount({ userId: 1, email: "a@b.c" })

    expect(usersService.deleteAccount).toHaveBeenCalledWith({
      userId: 1,
      email: "a@b.c",
    })
  })
})
