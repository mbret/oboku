import { useMutation, useQueryClient } from "reactjrx"
import { from, switchMap } from "rxjs"
import { COVERS_CACHE_KEY } from "./constants.sw"
import { USE_COVERS_CACHE_INFORMATION_KEY } from "./useCoversCacheInformation"

export const useRemoveCoversInCache = () => {
  const client = useQueryClient()

  return useMutation({
    mutationFn: () =>
      from(caches.open(COVERS_CACHE_KEY)).pipe(
        switchMap((cache) =>
          from(cache.keys()).pipe(
            switchMap((keys) => {
              return from(
                Promise.all(keys.map((request) => cache.delete(request)))
              )
            })
          )
        )
      ),
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: USE_COVERS_CACHE_INFORMATION_KEY
      })
    }
  })
}
