import { from, switchMap, map } from "rxjs"
import { useQuery$ } from "reactjrx"
import { serviceWorkerConfiguration } from "../config/configuration.sw"

export const USE_COVERS_CACHE_INFORMATION_KEY = ["storage/covers/size"]

export const useCoversCacheInformation = () =>
  useQuery$({
    queryKey: USE_COVERS_CACHE_INFORMATION_KEY,
    gcTime: 5 * 60 * 1000,
    queryFn: () =>
      from(caches.open(serviceWorkerConfiguration.SW_COVERS_CACHE_KEY)).pipe(
        switchMap((cache) =>
          from(cache.keys()).pipe(
            map((keys) => {
              const weight = keys.reduce((acc, key) => {
                return (
                  acc + parseInt(key.headers.get("Oboku-Sw-Cover-Size") || "0")
                )
              }, 0)

              return { size: keys.length, weight }
            }),
          ),
        ),
      ),
  })
