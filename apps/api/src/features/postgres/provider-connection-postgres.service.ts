import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ProviderConnectionPostgresEntity } from "./entities.js"

type ConnectionKey = { userId: number; provider: string }

@Injectable()
export class ProviderConnectionPostgresService {
  constructor(
    @InjectRepository(ProviderConnectionPostgresEntity)
    private readonly connectionRepository: Repository<ProviderConnectionPostgresEntity>,
  ) {}

  find({ userId, provider }: ConnectionKey) {
    return this.connectionRepository.findOne({
      where: { user_id: userId, provider },
    })
  }

  /** Replaces the user's previous connection to the provider, if any. */
  async save({
    userId,
    provider,
    encryptedCredentials,
    accountId,
    accountName,
    scopes,
  }: ConnectionKey & {
    encryptedCredentials: string
    accountId: string
    accountName: string
    scopes: string[]
  }) {
    const connectedAt = new Date()

    await this.connectionRepository.upsert(
      {
        user_id: userId,
        provider,
        encrypted_credentials: encryptedCredentials,
        account_id: accountId,
        account_name: accountName,
        scopes,
        connected_at: connectedAt,
        updated_at: connectedAt,
      },
      ["user_id", "provider"],
    )
  }

  async delete({ userId, provider }: ConnectionKey) {
    await this.connectionRepository.delete({ user_id: userId, provider })
  }

  async deleteByUserId(userId: number) {
    await this.connectionRepository.delete({ user_id: userId })
  }
}
