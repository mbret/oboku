import { useQuery } from "@tanstack/react-query"

export const STORAGE_PERSISTENCE_QUERY_KEY = ["storage/persistence"]

export const useIsStoragePersisted = () =>
  useQuery({
    queryKey: STORAGE_PERSISTENCE_QUERY_KEY,
    networkMode: "always",
    queryFn: () => navigator.storage.persisted(),
  })
