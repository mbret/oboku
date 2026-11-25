import { useQueries } from "@tanstack/react-query"
import type { OneDriveLinkData } from "@oboku/shared"
import { useCreateLibrarySyncLocationQuery } from "./useLibrarySyncLocation"

export function useLibrarySyncLocations({
  locations,
}: {
  locations: readonly OneDriveLinkData[]
}) {
  const createQuery = useCreateLibrarySyncLocationQuery()

  const locationQueries = useQueries({
    queries: locations.map((location) => createQuery(location)),
  })

  return {
    driveItems: locationQueries.map((query) => query.data),
    hasLocationResolutionErrors: locationQueries.some((query) => !!query.error),
  }
}
