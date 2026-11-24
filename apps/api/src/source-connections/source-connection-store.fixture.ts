import type { SourceConnectionPostgresEntity } from "../features/postgres/entities.js"
import type { SourceConnectionPostgresService } from "../features/postgres/source-connection-postgres.service.js"

export const toConnectionRowKey = ({
  userId,
  provider,
  accountId,
}: {
  userId: number
  provider: string
  accountId: string
}) => `${userId}:${provider}:${accountId}`

/** Keeps rows in memory, keyed by user, source and account like the table's unique index. */
export const createConnectionStore = () => {
  const rows = new Map<string, SourceConnectionPostgresEntity>()
  let lastRowId = 0

  const save: SourceConnectionPostgresService["save"] = async (connection) => {
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
    SourceConnectionPostgresService,
    | "find"
    | "list"
    | "save"
    | "saveAsOnlyAccount"
    | "delete"
    | "deleteIfUnchanged"
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
        const isOtherAccountOfSource =
          row.user_id === connection.userId &&
          row.provider === connection.provider &&
          row.account_id !== connection.accountId

        if (isOtherAccountOfSource) rows.delete(key)
      }

      await save(connection)
    },
    delete: async (key) => {
      rows.delete(toConnectionRowKey(key))
    },
    deleteIfUnchanged: async ({ updatedAt, ...key }) => {
      const rowKey = toConnectionRowKey(key)
      const isUnchanged =
        rows.get(rowKey)?.updated_at.getTime() === updatedAt.getTime()

      if (isUnchanged) rows.delete(rowKey)

      return isUnchanged
    },
  }

  return { rows, store }
}
