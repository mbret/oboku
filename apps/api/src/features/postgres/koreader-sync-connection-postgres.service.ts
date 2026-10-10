import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { KoreaderSyncConnectionPostgresEntity } from "./entities.js"

@Injectable()
export class KoreaderSyncConnectionPostgresService {
  constructor(
    @InjectRepository(KoreaderSyncConnectionPostgresEntity)
    private readonly connectionRepository: Repository<KoreaderSyncConnectionPostgresEntity>,
  ) {}

  findByUserId(userId: number) {
    return this.connectionRepository.findOne({ where: { user_id: userId } })
  }

  /** Replaces the user's previous connection, if any. */
  async save({
    userId,
    serverUrl,
    username,
    encryptedKey,
  }: {
    userId: number
    serverUrl: string
    username: string
    encryptedKey: string
  }) {
    await this.connectionRepository.upsert(
      {
        user_id: userId,
        server_url: serverUrl,
        username,
        encrypted_key: encryptedKey,
        connected_at: new Date(),
      },
      ["user_id"],
    )
  }

  async deleteByUserId(userId: number) {
    await this.connectionRepository.delete({ user_id: userId })
  }
}
