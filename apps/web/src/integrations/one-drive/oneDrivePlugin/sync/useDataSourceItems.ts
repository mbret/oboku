import { useQueries } from "@tanstack/react-query"
import type { OneDriveLinkData } from "@oboku/shared"
import { useCreateDataSourceItemQuery } from "./useDataSourceItem"

export function useDataSourceItems({
  items,
}: {
  items: readonly OneDriveLinkData[]
}) {
  const createQuery = useCreateDataSourceItemQuery()

  const itemQueries = useQueries({
    queries: items.map((item) => createQuery(item)),
  })

  return {
    driveItems: itemQueries.map((query) => query.data),
    hasItemResolutionErrors: itemQueries.some((query) => !!query.error),
  }
}
