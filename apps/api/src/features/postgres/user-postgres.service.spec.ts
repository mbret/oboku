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

  it("resolves user ids with a normalized email lookup", async () => {
    const select = jest.fn().mockReturnThis()
    const where = jest.fn().mockReturnThis()
    const getRawOne = jest.fn().mockResolvedValue({ id: 42 })

    repository.createQueryBuilder.mockReturnValue({
      select,
      where,
      getRawOne,
    })

    await expect(
      service.resolveUserIdByEmail(" Reader@Example.com "),
    ).resolves.toBe(42)

    expect(repository.createQueryBuilder).toHaveBeenCalledWith("user")
    expect(select).toHaveBeenCalledWith("user.id", "id")
    expect(where).toHaveBeenCalledWith("LOWER(user.email) = :email", {
      email: "reader@example.com",
    })
    expect(getRawOne).toHaveBeenCalled()
  })
})
