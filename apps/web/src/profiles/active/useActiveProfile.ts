import { useSignalValue } from "reactjrx"
import { activeProfileIdSignal } from "./activeProfileId"
import { type QueryClient, useQuery } from "@tanstack/react-query"
import { profileByIdQueryOptions } from "../../auth/authSession"

export const useActiveProfile = () => {
  const activeProfileId = useSignalValue(activeProfileIdSignal)

  return useQuery(profileByIdQueryOptions(activeProfileId))
}

export const ensureActiveProfile = (
  queryClient: QueryClient,
  activeProfileId: string | null | undefined,
) => {
  if (!activeProfileId) return Promise.resolve(null)

  return queryClient.ensureQueryData(profileByIdQueryOptions(activeProfileId))
}
