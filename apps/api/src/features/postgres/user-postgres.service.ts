import { ConflictException, Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { UserPostgresEntity } from "./entities"

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

const logger = new Logger("UserPostgresService")

@Injectable()
export class UserPostgresService {
  constructor(
    @InjectRepository(UserPostgresEntity)
    private readonly userRepository: Repository<UserPostgresEntity>,
  ) {}

  async findByEmail(email: string): Promise<UserPostgresEntity | null> {
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

  async create(user: Omit<UserPostgresEntity, "id">) {
    const newUser = this.userRepository.create({
      ...user,
      email: normalizeEmail(user.email),
    })

    await this.userRepository.save(newUser)

    return newUser
  }

  async save(user: UserPostgresEntity) {
    user.email = normalizeEmail(user.email)

    return this.userRepository.save(user)
  }

  async deleteById(userId: number) {
    await this.userRepository.delete(userId)
  }

  async getAllUserIds(): Promise<number[]> {
    const users = await this.userRepository.find({ select: ["id"] })

    return [...new Set(users.map(({ id }) => id))]
  }

  async getUserIdsByEmails(emails: string[]): Promise<number[]> {
    const users = await this.userRepository
      .createQueryBuilder("user")
      .select("user.id")
      .where("LOWER(user.email) IN (:...emails)", { emails })
      .getMany()

    return users.map(({ id }) => id)
  }
}
