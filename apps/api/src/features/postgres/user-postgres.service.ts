import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { UserPostgresEntity } from "./entities"

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

@Injectable()
export class UserPostgresService {
  constructor(
    @InjectRepository(UserPostgresEntity)
    private readonly userRepository: Repository<UserPostgresEntity>,
  ) {}

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
