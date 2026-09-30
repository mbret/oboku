import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import {
  KoreaderSyncCredentialPostgresEntity,
  KoreaderSyncProgressPostgresEntity,
} from "./entities"

export type KoreaderSyncProgress = Omit<
  KoreaderSyncProgressPostgresEntity,
  "id"
>

@Injectable()
export class KoreaderSyncPostgresService {
  constructor(
    @InjectRepository(KoreaderSyncCredentialPostgresEntity)
    private readonly credentialRepository: Repository<KoreaderSyncCredentialPostgresEntity>,
    @InjectRepository(KoreaderSyncProgressPostgresEntity)
    private readonly progressRepository: Repository<KoreaderSyncProgressPostgresEntity>,
  ) {}

  findCredentialByUserId(userId: number) {
    return this.credentialRepository.findOne({ where: { user_id: userId } })
  }

  async saveCredential({
    userId,
    keyHash,
  }: {
    userId: number
    keyHash: string
  }) {
    await this.credentialRepository.upsert(
      { user_id: userId, key_hash: keyHash, created_at: new Date() },
      ["user_id"],
    )
  }

  findProgress({ userId, document }: { userId: number; document: string }) {
    return this.progressRepository.findOne({
      where: { user_id: userId, document },
    })
  }

  async saveProgress(progress: KoreaderSyncProgress) {
    await this.progressRepository.upsert(progress, ["user_id", "document"])
  }

  async deleteByUserId(userId: number) {
    await this.credentialRepository.delete({ user_id: userId })
    await this.progressRepository.delete({ user_id: userId })
  }
}
