import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ProviderConnectionPostgresEntity } from "./entities.js"

type ProviderKey = { userId: number; provider: string }

type ConnectionKey = ProviderKey & { accountId: string }

@Injectable()
export class ProviderConnectionPostgresService {
  constructor(
    @InjectRepository(ProviderConnectionPostgresEntity)
    private readonly connectionRepository: Repository<ProviderConnectionPostgresEntity>,
  ) {}

  find({ userId, provider, accountId }: ConnectionKey) {
    return this.connectionRepository.findOne({
      where: { user_id: userId, provider, account_id: accountId },
    })
  }

  /** The user's connections to the provider, the latest first. */
  list({ userId, provider }: ProviderKey) {
    return this.connectionRepository.find({
      where: { user_id: userId, provider },
      order: { connected_at: "DESC", id: "DESC" },
    })
  }

  /** Replaces the user's previous connection to the same account, if any. */
  async save({
    userId,
    provider,
    accountId,
    encryptedCredentials,
    accountName,
    scopes,
  }: ConnectionKey & {
    encryptedCredentials: string
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
      ["user_id", "provider", "account_id"],
    )
  }

  async delete({ userId, provider, accountId }: ConnectionKey) {
    await this.connectionRepository.delete({
      user_id: userId,
      provider,
      account_id: accountId,
    })
  }

  async deleteByUserId(userId: number) {
    await this.connectionRepository.delete({ user_id: userId })
  }
}
