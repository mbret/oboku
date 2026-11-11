import type { ProviderConnectionPostgresEntity } from "../features/postgres/entities.js"
import type { ProviderConnectionPostgresService } from "../features/postgres/provider-connection-postgres.service.js"

/** Keeps rows in memory, keyed `<userId>:<provider>` like the table's unique index. */
export const createConnectionStore = () => {
  const rows = new Map<string, ProviderConnectionPostgresEntity>()
  const toKey = ({ userId, provider }: { userId: number; provider: string }) =>
    `${userId}:${provider}`

  const store: Pick<
    ProviderConnectionPostgresService,
    "find" | "save" | "delete"
  > = {
    find: async (key) => rows.get(toKey(key)) ?? null,
    save: async (connection) => {
      const connectedAt = new Date()

      rows.set(toKey(connection), {
        id: rows.size + 1,
        user_id: connection.userId,
        provider: connection.provider,
        encrypted_credentials: connection.encryptedCredentials,
        account_id: connection.accountId,
        account_name: connection.accountName,
        scopes: connection.scopes,
        connected_at: connectedAt,
        updated_at: connectedAt,
      })
    },
    delete: async (key) => {
      rows.delete(toKey(key))
    },
  }

  return { rows, store }
}
