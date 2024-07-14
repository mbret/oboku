import { useEffect } from "react"
import { signal, useMutation } from "reactjrx"
import {
  combineLatest,
  from,
  map,
  mergeMap,
} from "rxjs"
import { loadScript } from "../../../common/utils"
import { retryOnFailure } from "./scripts"

const ID = "oboku-google-api-script"

export const gapiSignal = signal<
  { gapi: undefined; state: "loading" } | { gapi: typeof gapi; state: "loaded" }
>({
  default: { gapi: undefined, state: "loading" }
})

export const gapiOrThrow$ = gapiSignal.subject.pipe(
  map(({ gapi }) => {
    if (!gapi) {
      throw new Error("gapi not available")
    }

    return gapi
  })
)

export const useLoadGapi = () => {
  const { mutate } = useMutation({
    mapOperator: "switch",
    mutationFn: () => {
      return loadScript({
        id: ID,
        src: "https://apis.google.com/js/api.js"
      }).pipe(
        retryOnFailure,
        mergeMap(() =>
          combineLatest([
            from(
              new Promise((resolve, reject) => {
                window.gapi.load("client", {
                  callback: resolve,
                  onerror: reject
                })
              })
            ).pipe(retryOnFailure),
            from(
              new Promise((resolve, reject) => {
                window.gapi.load("picker", {
                  callback: resolve,
                  onerror: reject
                })
              })
            ).pipe(retryOnFailure)
          ]).pipe(
            mergeMap(() =>
              from(
                window.gapi.client.init({
                  discoveryDocs: [
                    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
                  ]
                })
              ).pipe(retryOnFailure)
            ),
            map(() => {
              gapiSignal.setValue({
                gapi: window.gapi,
                state: "loaded"
              })

              return gapiSignal.getValue()
            })
          )
        )
      )
    }
  })

  useEffect(() => {
    mutate()
  }, [mutate])
}
