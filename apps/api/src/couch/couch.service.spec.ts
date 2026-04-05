import { JwtService } from "@nestjs/jwt"
import { Test, TestingModule } from "@nestjs/testing"
import { AppConfigService } from "src/config/AppConfigService"
import { SecretsService } from "src/config/SecretsService"
import { CouchService } from "./couch.service"

describe("CouchService", () => {
  let service: CouchService
  let jwtService: {
    signAsync: jest.Mock
  }

  beforeEach(async () => {
    jwtService = {
      signAsync: jest.fn().mockResolvedValue("signed-jwt"),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouchService,
        {
          provide: AppConfigService,
          useValue: {
            COUCH_DB_URL: "http://localhost:5984",
            config: {
              get: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: SecretsService,
          useValue: {
            getJwtPrivateKey: jest.fn().mockResolvedValue("private-key"),
          },
        },
      ],
    }).compile()

    service = module.get<CouchService>(CouchService)
  })

  it("uses a short ttl for end-user Couch access tokens", async () => {
    await service.generateUserJWT({
      email: "reader@example.com",
      userId: 1,
    })

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: "reader@example.com",
        userId: 1,
      }),
      expect.objectContaining({
        expiresIn: "5m",
      }),
    )
  })

  it("uses a long ttl for internal admin Couch clients", async () => {
    await service.generateAdminJWT()

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: "admin",
      }),
      expect.objectContaining({
        expiresIn: "7d",
      }),
    )
  })

  it("uses a long ttl for internal user Couch clients", async () => {
    await service.createNanoInstanceForUser({
      email: "reader@example.com",
    })

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: "reader@example.com",
      }),
      expect.objectContaining({
        expiresIn: "7d",
      }),
    )
  })
})
