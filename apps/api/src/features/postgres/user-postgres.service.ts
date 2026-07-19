import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { UserPostgresEntity } from "./entities"

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const normalizeAudienceEmails = (
  emails: string[] | undefined,
  emptyMessage: string,
): string[] => {
  const normalized = [...new Set((emails ?? []).map(normalizeEmail))].filter(
    (email) => email.length > 0,
  )

  if (normalized.length === 0) {
    throw new BadRequestException(emptyMessage)
  }

  return normalized
}

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

  async findById(userId: number): Promise<UserPostgresEntity | null> {
    return this.userRepository.findOne({
      where: { id: userId },
    })
  }

  async create(user: Omit<UserPostgresEntity, "id" | "createdAt">) {
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

    return users.map(({ id }) => id)
  }

  async getAllUsers(): Promise<
    Pick<
      UserPostgresEntity,
      "id" | "email" | "username" | "emailVerified" | "createdAt" | "password"
    >[]
  > {
    return this.userRepository.find({
      select: [
        "id",
        "email",
        "username",
        "emailVerified",
        "createdAt",
        "password",
      ],
      order: { id: "ASC" },
    })
  }

  async getAllUserEmails(): Promise<string[]> {
    const users = await this.userRepository.find({ select: ["email"] })

    return [
      ...new Set(
        users
          .map(({ email }) => normalizeEmail(email ?? ""))
          .filter((email) => email.length > 0),
      ),
    ]
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
