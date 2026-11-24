import { useQueries } from "@tanstack/react-query"
import type { OneDriveLinkData } from "@oboku/shared"
import { useCreateLibrarySyncItemQuery } from "./useLibrarySyncItem"

export function useLibrarySyncItems({
  items,
}: {
  items: readonly OneDriveLinkData[]
}) {
  const createQuery = useCreateLibrarySyncItemQuery()

  const itemQueries = useQueries({
    queries: items.map((item) => createQuery(item)),
  })

  return {
    driveItems: itemQueries.map((query) => query.data),
    hasItemResolutionErrors: itemQueries.some((query) => !!query.error),
  }
}
