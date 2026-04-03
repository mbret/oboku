import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { UserPostgresEntity } from "../features/postgres/entities"
import { Repository } from "typeorm"
import { normalizeEmail } from "src/features/postgres/user-postgres.service"

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserPostgresEntity)
    private userRepository: Repository<UserPostgresEntity>,
  ) {}

  async findUserByEmail(email: string): Promise<UserPostgresEntity | null> {
    return this.userRepository
      .createQueryBuilder("user")
      .where("LOWER(user.email) = :email", { email: normalizeEmail(email) })
      .getOne()
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
