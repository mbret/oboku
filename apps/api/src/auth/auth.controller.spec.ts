import { BadRequestException } from "@nestjs/common"
import { ValidationPipe } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import {
  AuthController,
  SignInWithEmailDto,
  SignInWithGoogleDto,
} from "./auth.controller"
import { AuthService } from "./auth.service"

describe("AuthController", () => {
  let controller: AuthController
  let validationPipe: ValidationPipe
  let authService: {
    requestSignUp: jest.Mock<Promise<void>, [{ email: string }]>
    completeSignUp: jest.Mock
    signInWithEmail: jest.Mock
    signInWithGoogle: jest.Mock
    refreshToken: jest.Mock
    deleteAccount: jest.Mock
  }

  beforeEach(async () => {
    authService = {
      requestSignUp: jest.fn().mockResolvedValue(undefined),
      completeSignUp: jest.fn(),
      signInWithEmail: jest.fn(),
      signInWithGoogle: jest.fn(),
      refreshToken: jest.fn(),
      deleteAccount: jest.fn().mockResolvedValue(undefined),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
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

  it("forwards a valid email sign-in request", async () => {
    authService.signInWithEmail.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      dbName: "db-name",
      email: "reader@example.com",
      nameHex: "abc",
    })

    const body = await validationPipe.transform(
      {
        email: "reader@example.com",
        password: "password",
        installation_id: "installation-1",
      },
      {
        type: "body",
        metatype: SignInWithEmailDto,
        data: "",
      },
    )

    await controller.signinWithEmail(body)

    expect(authService.signInWithEmail).toHaveBeenCalledWith({
      email: "reader@example.com",
      password: "password",
      installation_id: "installation-1",
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
      },
      {
        type: "body",
        metatype: SignInWithGoogleDto,
        data: "",
      },
    )

    await controller.signinWithGoogle(body)

    expect(authService.signInWithGoogle).toHaveBeenCalledWith({
      token: "google-token",
      installation_id: "installation-1",
    })
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
})
