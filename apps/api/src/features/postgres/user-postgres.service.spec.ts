import { ConflictException } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { UserPostgresEntity } from "./entities"
import { UserPostgresService } from "./user-postgres.service"

describe("UserPostgresService", () => {
  let service: UserPostgresService
  let repository: {
    create: jest.Mock
    save: jest.Mock
    createQueryBuilder: jest.Mock
  }

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
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

  it("looks up users with a normalized email", async () => {
    const where = jest.fn().mockReturnThis()
    const getMany = jest.fn().mockResolvedValue([])

    repository.createQueryBuilder.mockReturnValue({
      where,
      getMany,
    })

    await service.findByEmail(" Reader@Example.com ")

    expect(repository.createQueryBuilder).toHaveBeenCalledWith("user")
    expect(where).toHaveBeenCalledWith("LOWER(user.email) = :email", {
      email: "reader@example.com",
    })
    expect(getMany).toHaveBeenCalled()
  })

  it("rejects ambiguous case-insensitive email matches", async () => {
    const where = jest.fn().mockReturnThis()
    const getMany = jest.fn().mockResolvedValue([
      { id: 1, email: "Reader@example.com" },
      { id: 2, email: "reader@example.com" },
    ])

    repository.createQueryBuilder.mockReturnValue({
      where,
      getMany,
    })

    await expect(
      service.findByEmail("reader@example.com"),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it("normalizes emails before registering users", async () => {
    repository.create.mockImplementation((value: unknown) => value)
    repository.save.mockResolvedValue(undefined)

    const createdUser = await service.create({
      email: " Reader@Example.com ",
      username: "Reader",
      password: "hashed-password",
      emailVerified: false,
    })

    expect(repository.create).toHaveBeenCalledWith({
      email: "reader@example.com",
      username: "Reader",
      password: "hashed-password",
      emailVerified: false,
    })
    expect(repository.save).toHaveBeenCalledWith(createdUser)
  })

  it("normalizes emails before saving users", async () => {
    const user = {
      id: 1,
      email: " Reader@Example.com ",
      username: "Reader",
      password: "hashed-password",
      emailVerified: true,
    }
    repository.save.mockResolvedValue(user)

    await service.save(user)

    expect(user.email).toBe("reader@example.com")
    expect(repository.save).toHaveBeenCalledWith(user)
  })
})
