import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Not, type Repository } from "typeorm"
import {
  ProviderConnectionPostgresEntity,
  UserPostgresEntity,
} from "./entities.js"

type ProviderKey = { userId: number; provider: string }

type ConnectionKey = ProviderKey & { accountId: string }

type SavedConnection = ConnectionKey & {
  encryptedCredentials: string
  accountName: string
  scopes: string[]
}

const CONNECTION_KEY_COLUMNS = ["user_id", "provider", "account_id"]

const toConnectionRow = ({
  userId,
  provider,
  accountId,
  encryptedCredentials,
  accountName,
  scopes,
}: SavedConnection) => {
  const connectedAt = new Date()

  return {
    user_id: userId,
    provider,
    encrypted_credentials: encryptedCredentials,
    account_id: accountId,
    account_name: accountName,
    scopes,
    connected_at: connectedAt,
    updated_at: connectedAt,
  }
}

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
  async save(connection: SavedConnection) {
    await this.connectionRepository.upsert(
      toConnectionRow(connection),
      CONNECTION_KEY_COLUMNS,
    )
  }

  /**
   * Saves the connection as the user's only one to the provider, deleting
   * those to other accounts. A lock on the user's row makes concurrent saves
   * for one user wait for each other, so the last one is kept.
   */
  saveAsOnlyAccount(connection: SavedConnection) {
    return this.connectionRepository.manager.transaction(
      async function replaceOtherAccountsWhileUserIsLocked(manager) {
        await manager.findOne(UserPostgresEntity, {
          where: { id: connection.userId },
          lock: { mode: "pessimistic_write" },
        })
        await manager.delete(ProviderConnectionPostgresEntity, {
          user_id: connection.userId,
          provider: connection.provider,
          account_id: Not(connection.accountId),
        })
        await manager.upsert(
          ProviderConnectionPostgresEntity,
          toConnectionRow(connection),
          CONNECTION_KEY_COLUMNS,
        )
      },
    )
  }

  async delete({ userId, provider, accountId }: ConnectionKey) {
    await this.connectionRepository.delete({
      user_id: userId,
      provider,
      account_id: accountId,
    })
  }

  /**
   * Deletes the connection while its credentials are still the ones written
   * at `updatedAt`. A connection the user made since stays.
   *
   * @returns `false` when it deleted nothing.
   */
  async deleteIfUnchanged({
    userId,
    provider,
    accountId,
    updatedAt,
  }: ConnectionKey & { updatedAt: Date }) {
    const { affected } = await this.connectionRepository.delete({
      user_id: userId,
      provider,
      account_id: accountId,
      updated_at: updatedAt,
    })

    return Boolean(affected)
  }

  async deleteByUserId(userId: number) {
    await this.connectionRepository.delete({ user_id: userId })
  }
}
