import { Test, TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { UserPostgresEntity } from "../features/postgres/entities"
import { UsersService } from "./users.service"

describe("UsersService", () => {
  let service: UsersService
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
        UsersService,
        {
          provide: getRepositoryToken(UserPostgresEntity),
          useValue: repository,
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  it("looks up users with a normalized email", async () => {
    const where = jest.fn().mockReturnThis()
    const getOne = jest.fn().mockResolvedValue(null)

    repository.createQueryBuilder.mockReturnValue({
      where,
      getOne,
    })

    await service.findUserByEmail(" Reader@Example.com ")

    expect(repository.createQueryBuilder).toHaveBeenCalledWith("user")
    expect(where).toHaveBeenCalledWith("LOWER(user.email) = :email", {
      email: "reader@example.com",
    })
    expect(getOne).toHaveBeenCalled()
  })

  it("normalizes emails before registering users", async () => {
    repository.create.mockImplementation((value) => value)
    repository.save.mockResolvedValue(undefined)

    const createdUser = await service.registerUser({
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

    await service.saveUser(user)

    expect(user.email).toBe("reader@example.com")
    expect(repository.save).toHaveBeenCalledWith(user)
  })
})
