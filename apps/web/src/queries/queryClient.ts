import type { UseQueryOptions } from "@tanstack/react-query"

export const API_QUERY_KEY_PREFIX = "api" as const
export const RXDB_QUERY_KEY_PREFIX = "rxdb" as const

export const createRxdbQueryDefaultOptions = (): Pick<
  UseQueryOptions,
  "networkMode"
> => ({
  // they run on local database, never on network so they have no network constraints.
  networkMode: "always",
})
