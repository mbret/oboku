import type { ProviderConnectionPostgresEntity } from "../features/postgres/entities.js"
import type { ProviderConnectionPostgresService } from "../features/postgres/provider-connection-postgres.service.js"

export const toConnectionRowKey = ({
  userId,
  provider,
  accountId,
}: {
  userId: number
  provider: string
  accountId: string
}) => `${userId}:${provider}:${accountId}`

/** Keeps rows in memory, keyed by user, provider and account like the table's unique index. */
export const createConnectionStore = () => {
  const rows = new Map<string, ProviderConnectionPostgresEntity>()
  let lastRowId = 0

  const save: ProviderConnectionPostgresService["save"] = async (
    connection,
  ) => {
    const connectedAt = new Date()

    lastRowId += 1
    rows.set(toConnectionRowKey(connection), {
      id: lastRowId,
      user_id: connection.userId,
      provider: connection.provider,
      encrypted_credentials: connection.encryptedCredentials,
      account_id: connection.accountId,
      account_name: connection.accountName,
      scopes: connection.scopes,
      connected_at: connectedAt,
      updated_at: connectedAt,
    })
  }

  const store: Pick<
    ProviderConnectionPostgresService,
    "find" | "list" | "save" | "saveAsOnlyAccount" | "delete"
  > = {
    find: async (key) => rows.get(toConnectionRowKey(key)) ?? null,
    list: async ({ userId, provider }) =>
      [...rows.values()]
        .filter((row) => row.user_id === userId && row.provider === provider)
        .sort(function latestFirst(a, b) {
          return (
            b.connected_at.getTime() - a.connected_at.getTime() || b.id - a.id
          )
        }),
    save,
    saveAsOnlyAccount: async (connection) => {
      for (const [key, row] of rows) {
        const isOtherAccountOfProvider =
          row.user_id === connection.userId &&
          row.provider === connection.provider &&
          row.account_id !== connection.accountId

        if (isOtherAccountOfProvider) rows.delete(key)
      }

      await save(connection)
    },
    delete: async (key) => {
      rows.delete(toConnectionRowKey(key))
    },
  }

  return { rows, store }
}
