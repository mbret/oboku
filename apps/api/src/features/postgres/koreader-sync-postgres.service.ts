import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import {
  KoreaderSyncCredentialPostgresEntity,
  KoreaderSyncProgressPostgresEntity,
} from "./entities.js"

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

  /**
   * Saves the position only while the user still has a credential, which a
   * share lock keeps in place until the save commits, so a push authorized
   * just before `deleteByUserId` cannot bring back a position it deleted.
   *
   * @returns `false` when the credential is gone.
   */
  saveProgress(progress: KoreaderSyncProgress) {
    return this.progressRepository.manager.transaction(
      async function saveWhileCredentialExists(manager) {
        const credential = await manager.findOne(
          KoreaderSyncCredentialPostgresEntity,
          {
            where: { user_id: progress.user_id },
            lock: { mode: "pessimistic_read" },
          },
        )

        if (!credential) return false

        await manager.upsert(KoreaderSyncProgressPostgresEntity, progress, [
          "user_id",
          "document",
        ])

        return true
      },
    )
  }

  /**
   * The credential goes first: a save holding its share lock commits before
   * the positions are deleted, and its position is deleted with them.
   */
  async deleteByUserId(userId: number) {
    await this.credentialRepository.manager.transaction(
      async function deleteCredentialThenProgress(manager) {
        await manager.delete(KoreaderSyncCredentialPostgresEntity, {
          user_id: userId,
        })
        await manager.delete(KoreaderSyncProgressPostgresEntity, {
          user_id: userId,
        })
      },
    )
  }
}
