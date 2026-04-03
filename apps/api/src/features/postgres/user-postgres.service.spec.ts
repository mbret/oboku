import { Test, TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { UserPostgresEntity } from "./entities"
import { UserPostgresService } from "./user-postgres.service"

describe("UserPostgresService", () => {
  let service: UserPostgresService
  let repository: {
    createQueryBuilder: jest.Mock
  }

  beforeEach(async () => {
    repository = {
      createQueryBuilder: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPostgresService,
        {
          provide: getRepositoryToken(UserPostgresEntity),
          useValue: repository,
        },
      ],
    }).compile()

    service = module.get<UserPostgresService>(UserPostgresService)
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })
})
