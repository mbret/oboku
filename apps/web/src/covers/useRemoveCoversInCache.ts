import { useMutation$ } from "reactjrx"
import { from, switchMap } from "rxjs"
import { USE_COVERS_CACHE_INFORMATION_KEY } from "./useCoversCacheInformation"
import { useQueryClient } from "@tanstack/react-query"
import { serviceWorkerConfiguration } from "../config/configuration.sw"

export const useRemoveCoversInCache = () => {
  const client = useQueryClient()

  return useMutation$({
    mutationFn: () =>
      from(caches.open(serviceWorkerConfiguration.SW_COVERS_CACHE_KEY)).pipe(
        switchMap((cache) =>
          from(cache.keys()).pipe(
            switchMap((keys) => {
              return from(
                Promise.all(keys.map((request) => cache.delete(request))),
              )
            }),
          ),
        ),
      ),
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: USE_COVERS_CACHE_INFORMATION_KEY,
      })
    },
  })
}
