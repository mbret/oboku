import { ConflictException, Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { UserPostgresEntity } from "../features/postgres/entities"
import { Repository } from "typeorm"
import { normalizeEmail } from "src/features/postgres/user-postgres.service"

const logger = new Logger("UsersService")

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserPostgresEntity)
    private userRepository: Repository<UserPostgresEntity>,
  ) {}

  async findUserByEmail(email: string): Promise<UserPostgresEntity | null> {
    const matches = await this.userRepository
      .createQueryBuilder("user")
      .where("LOWER(user.email) = :email", { email: normalizeEmail(email) })
      .getMany()

    if (matches.length > 1) {
      logger.error(
        `Ambiguous email lookup: ${matches.length} users share the same normalized email`,
      )

      throw new ConflictException()
    }

    return matches[0] ?? null
  }

  async registerUser(user: Omit<UserPostgresEntity, "id">) {
    const newUser = this.userRepository.create({
      ...user,
      email: normalizeEmail(user.email),
    })

    await this.userRepository.save(newUser)

    return newUser
  }

  async saveUser(user: UserPostgresEntity) {
    user.email = normalizeEmail(user.email)

    return this.userRepository.save(user)
  }
}
