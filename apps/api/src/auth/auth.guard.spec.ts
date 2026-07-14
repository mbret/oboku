import type { ExecutionContext } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { Test, TestingModule } from "@nestjs/testing"
import { SecretsService } from "src/config/SecretsService"
import { AuthGuard } from "./auth.guard"

const createContext = ({
  cookies,
  headers = {},
}: {
  cookies?: Record<string, string>
  headers?: Record<string, string>
}) => {
  const request = { cookies, headers, user: undefined }
  // Test double carrying only the members the guard touches.
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext

  return { context, request }
}

describe("AuthGuard", () => {
  let guard: AuthGuard
  let jwtService: { verifyAsync: jest.Mock }

  beforeEach(async () => {
    jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        name: "reader@example.com",
        sub: "reader@example.com",
        userId: 42,
        "couchdb.roles": [],
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: jwtService },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn().mockReturnValue(false) },
        },
        {
          provide: SecretsService,
          useValue: {
            getJwtPublicKey: jest.fn().mockResolvedValue("public-key"),
          },
        },
      ],
    }).compile()

    guard = module.get<AuthGuard>(AuthGuard)
  })

  it("authenticates from the access cookie", async () => {
    const { context, request } = createContext({
      cookies: { oboku_access_token: "cookie-jwt" },
    })

    await expect(guard.canActivate(context)).resolves.toBe(true)

    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      "cookie-jwt",
      expect.anything(),
    )
    expect(request.user).toMatchObject({ email: "reader@example.com" })
  })

  it("prefers the cookie over the Authorization header", async () => {
    const { context } = createContext({
      cookies: { oboku_access_token: "cookie-jwt" },
      headers: { authorization: "Bearer header-jwt" },
    })

    await guard.canActivate(context)

    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      "cookie-jwt",
      expect.anything(),
    )
  })

  it("falls back to the Authorization header (admin, unmigrated sessions)", async () => {
    const { context } = createContext({
      headers: { authorization: "Bearer header-jwt" },
    })

    await expect(guard.canActivate(context)).resolves.toBe(true)

    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      "header-jwt",
      expect.anything(),
    )
  })

  it("rejects requests with no credential at all", async () => {
    const { context } = createContext({})

    await expect(guard.canActivate(context)).rejects.toThrow()

    expect(jwtService.verifyAsync).not.toHaveBeenCalled()
  })
})
