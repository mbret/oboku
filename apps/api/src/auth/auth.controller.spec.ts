import { Test, TestingModule } from "@nestjs/testing"
import { UsersService } from "../users/users.service"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"

describe("AuthController", () => {
  let controller: AuthController
  let authService: {
    requestSignUp: jest.Mock<Promise<void>, [{ email: string }]>
    completeSignUp: jest.Mock
    signIn: jest.Mock
    refreshToken: jest.Mock
  }

  beforeEach(async () => {
    authService = {
      requestSignUp: jest.fn().mockResolvedValue(undefined),
      completeSignUp: jest.fn(),
      signIn: jest.fn(),
      refreshToken: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: UsersService,
          useValue: {
            deleteAccount: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
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
})
