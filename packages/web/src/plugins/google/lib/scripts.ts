import { filter, first, mergeMap, Observable, retry, timer } from "rxjs"
import { networkState$ } from "../../../common/utils"

export const retryOnFailure = <O>(stream: Observable<O>) =>
  stream.pipe(
    /**
     * In case of error we retry in 1mn by default.
     * If network is offline, we wait for online and
     * retry right away. If we were online, it's unexpected
     * and will wait a couple of minutes before retrying
     */
    retry({
      delay: () =>
        networkState$.pipe(
          first(),
          mergeMap((state) => {
            if (state === "online") return timer(1000 * 60 * 5)

            return networkState$.pipe(
              first(),
              filter((state) => state === "online")
            )
          })
        )
    })
  )
