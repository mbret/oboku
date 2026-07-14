import { BadRequestException, UnauthorizedException } from "@nestjs/common"
import { ValidationPipe } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import type { Request, Response } from "express"
import {
  AuthController,
  RefreshTokenQueryDto,
  SignInWithEmailDto,
  SignInWithGoogleDto,
} from "./auth.controller"
import { AuthService } from "./auth.service"
import { AuthCookiesService } from "./auth-cookies"

// Test doubles carrying only the members the controller touches; the express
// interfaces are far larger, hence the assertions.
const createRequest = (cookies: Record<string, string> = {}) =>
  ({ cookies }) as unknown as Request
const createResponse = () => ({}) as unknown as Response

// RFC 7517 A.1 example P-256 key
const validPublicKey = {
  kty: "EC",
  crv: "P-256",
  x: "MKBCTNIcKUSDii11ySs3526iDZ8AiTo7Tu6KPAqv7D4",
  y: "4Etl6SRW2YiLUrN5vfvVHuhp7x8PxltmWWlbbM4IFyM",
}

describe("AuthController", () => {
  let controller: AuthController
  let validationPipe: ValidationPipe
  let authService: {
    requestSignUp: jest.Mock<Promise<void>, [{ email: string }]>
    completeSignUp: jest.Mock
    signInWithEmail: jest.Mock
    signInWithGoogle: jest.Mock
    refreshToken: jest.Mock
    logout: jest.Mock
    deleteAccount: jest.Mock
  }
  let authCookiesService: {
    set: jest.Mock
  }

  beforeEach(async () => {
    authService = {
      requestSignUp: jest.fn().mockResolvedValue(undefined),
      completeSignUp: jest.fn(),
      signInWithEmail: jest.fn(),
      signInWithGoogle: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn().mockResolvedValue(undefined),
      deleteAccount: jest.fn().mockResolvedValue(undefined),
    }
    authCookiesService = {
      set: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: AuthCookiesService,
          useValue: authCookiesService,
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    validationPipe = new ValidationPipe()
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  it("does not forward a request-derived app public url for public signup", async () => {
    await controller.signup({
      email: "reader@example.com",
    })

    expect(authService.requestSignUp).toHaveBeenCalledWith({
      email: "reader@example.com",
    })
  })

  it("forwards a valid email sign-in request and sets the auth cookies", async () => {
    const session = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      sessionId: "session-1",
      dbName: "db-name",
      email: "reader@example.com",
      nameHex: "abc",
    }
    authService.signInWithEmail.mockResolvedValue(session)

    const body = await validationPipe.transform(
      {
        email: "reader@example.com",
        password: "password",
        installation_id: "installation-1",
        public_key: validPublicKey,
      },
      {
        type: "body",
        metatype: SignInWithEmailDto,
        data: "",
      },
    )
    const request = createRequest()
    const response = createResponse()

    await expect(
      controller.signinWithEmail(body, request, response),
    ).resolves.toEqual({
      sessionId: "session-1",
      dbName: "db-name",
      email: "reader@example.com",
      nameHex: "abc",
    })

    expect(authService.signInWithEmail).toHaveBeenCalledWith({
      email: "reader@example.com",
      password: "password",
      installation_id: "installation-1",
      public_key: validPublicKey,
    })
    expect(authCookiesService.set).toHaveBeenCalledWith(request, response, {
      accessToken: "access-token",
      refreshToken: "refresh-token",
    })
  })

  it("rejects sign-in requests without installation_id", async () => {
    await expect(
      validationPipe.transform(
        {
          email: "reader@example.com",
          password: "password",
        },
        {
          type: "body",
          metatype: SignInWithEmailDto,
          data: "",
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(authService.signInWithEmail).not.toHaveBeenCalled()
  })

  it("rejects sign-in requests with an empty public_key", async () => {
    await expect(
      validationPipe.transform(
        {
          email: "reader@example.com",
          password: "password",
          installation_id: "installation-1",
          public_key: {},
        },
        {
          type: "body",
          metatype: SignInWithEmailDto,
          data: "",
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(authService.signInWithEmail).not.toHaveBeenCalled()
  })

  it("rejects sign-in requests whose public_key is missing its coordinates", async () => {
    await expect(
      validationPipe.transform(
        {
          email: "reader@example.com",
          password: "password",
          installation_id: "installation-1",
          public_key: { kty: "EC", crv: "P-256" },
        },
        {
          type: "body",
          metatype: SignInWithEmailDto,
          data: "",
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(authService.signInWithEmail).not.toHaveBeenCalled()
  })

  it("forwards a valid Google sign-in request", async () => {
    authService.signInWithGoogle.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      dbName: "db-name",
      email: "reader@example.com",
      nameHex: "abc",
    })

    const body = await validationPipe.transform(
      {
        token: "google-token",
        installation_id: "installation-1",
        public_key: validPublicKey,
      },
      {
        type: "body",
        metatype: SignInWithGoogleDto,
        data: "",
      },
    )

    await controller.signinWithGoogle(body, createRequest(), createResponse())

    expect(authService.signInWithGoogle).toHaveBeenCalledWith({
      token: "google-token",
      installation_id: "installation-1",
      public_key: validPublicKey,
    })
  })

  it("rejects sign-in requests without a proof public key", async () => {
    await expect(
      validationPipe.transform(
        {
          token: "google-token",
          installation_id: "installation-1",
        },
        {
          type: "body",
          metatype: SignInWithGoogleDto,
          data: "",
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(authService.signInWithGoogle).not.toHaveBeenCalled()
  })

  it("rejects Google sign-in requests without a token", async () => {
    await expect(
      validationPipe.transform(
        {
          installation_id: "installation-1",
        },
        {
          type: "body",
          metatype: SignInWithGoogleDto,
          data: "",
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(authService.signInWithGoogle).not.toHaveBeenCalled()
  })

  it("refreshes from the cookie", async () => {
    authService.refreshToken.mockResolvedValue({
      accessToken: "fresh-access-token",
      refreshToken: "rotated-refresh-token",
    })

    const request = createRequest({
      oboku_refresh_token: "cookie-refresh-token",
    })
    const response = createResponse()

    await expect(
      controller.refreshTokens(
        { grant_type: "refresh_token" },
        "proof-jwt",
        request,
        response,
      ),
    ).resolves.toEqual({})

    expect(authService.refreshToken).toHaveBeenCalledWith({
      refreshToken: "cookie-refresh-token",
      proof: "proof-jwt",
    })
    expect(authCookiesService.set).toHaveBeenCalledWith(request, response, {
      accessToken: "fresh-access-token",
      refreshToken: "rotated-refresh-token",
    })
  })

  it("rejects refresh without the cookie", async () => {
    await expect(
      controller.refreshTokens(
        { grant_type: "refresh_token" },
        undefined,
        createRequest(),
        createResponse(),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException)

    expect(authService.refreshToken).not.toHaveBeenCalled()
  })

  it("still validates the refresh grant type", async () => {
    await expect(
      validationPipe.transform(
        {},
        {
          type: "query",
          metatype: RefreshTokenQueryDto,
          data: "",
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(authService.refreshToken).not.toHaveBeenCalled()
  })

  it("revokes the session by id on logout and leaves the cookies untouched", async () => {
    await expect(
      controller.logout({ session_id: "session-1" }),
    ).resolves.toEqual({})

    expect(authService.logout).toHaveBeenCalledWith({ sessionId: "session-1" })
    expect(authCookiesService.set).not.toHaveBeenCalled()
  })
})
