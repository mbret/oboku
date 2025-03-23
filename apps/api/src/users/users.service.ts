import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { UserPostgresEntity } from "../features/postgres/entities"
import { Repository } from "typeorm"

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserPostgresEntity)
    private userRepository: Repository<UserPostgresEntity>,
  ) {}

  async findUserByEmail(email: string): Promise<UserPostgresEntity | null> {
    return this.userRepository.findOne({ where: { email } })
  }

  async registerUser(user: Omit<UserPostgresEntity, "id">) {
    const newUser = this.userRepository.create(user)

    await this.userRepository.save(newUser)

    return newUser
  }
}
