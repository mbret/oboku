import { signal, useSwitchMutation$ } from "reactjrx"
import { catchError, combineLatest, defer, from, map, mergeMap } from "rxjs"
import { GapiNotAvailableError } from "./errors"
import { loadScript, retryOnFailure } from "../../../common/scripts"

const ID = "oboku-google-api-script"

export const gapiSignal = signal<
  | {
      gapi: undefined
      state: "loading"
      error?: string
      loadingStep: undefined | "api" | "client"
    }
  | { gapi: typeof gapi; state: "loaded"; error?: string }
>({
  default: {
    gapi: undefined,
    state: "loading",
    error: undefined,
    loadingStep: undefined,
  },
})

export const gapiOrThrow$ = gapiSignal.subject.pipe(
  map(({ gapi }) => {
    if (!gapi) {
      throw new GapiNotAvailableError()
    }

    return gapi
  }),
)

const loadGapiClient = () =>
  defer(() =>
    from(
      new Promise((resolve, reject) => {
        window.gapi.load("client", {
          callback: resolve,
          onerror: reject,
        })
      }),
    ),
  )

const loadPicker = () =>
  defer(() =>
    from(
      new Promise((resolve, reject) => {
        window.gapi.load("picker", {
          callback: resolve,
          onerror: reject,
        })
      }),
    ),
  )

const initClient = () =>
  defer(() =>
    from(
      window.gapi.client.init({
        apiKey: "AIzaSyBgTV-RQecG_TFwilsdUJXqKmeXEiNSWUg",
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
        ],
      }),
    ),
  )

export const useLoadGapi = () => {
  return useSwitchMutation$({
    mutationKey: ["pluginGoogleScriptMutation"],
    mutationFn: () => {
      return loadScript({
        id: ID,
        src: "https://apis.google.com/js/api.js",
      }).pipe(
        catchError((error) => {
          gapiSignal.setValue((state) => ({
            ...state,
            error: "Error while loading script",
          }))

          throw error
        }),
        retryOnFailure,
        mergeMap(() =>
          combineLatest([
            loadGapiClient().pipe(
              catchError((error) => {
                gapiSignal.setValue((state) => ({
                  ...state,
                  error: "Error while loading client script",
                }))

                throw error
              }),
              retryOnFailure,
            ),
            loadPicker().pipe(
              catchError((error) => {
                gapiSignal.setValue((state) => ({
                  ...state,
                  error: "Error while loading picker script",
                }))

                throw error
              }),
              retryOnFailure,
            ),
          ]).pipe(
            mergeMap(() =>
              initClient().pipe(
                catchError((error) => {
                  gapiSignal.setValue((state) => ({
                    ...state,
                    error: "Error while initializing the client",
                  }))

                  throw error
                }),
                retryOnFailure,
              ),
            ),
            map(() => {
              gapiSignal.setValue({
                gapi: window.gapi,
                state: "loaded",
                error: undefined,
              })

              return gapiSignal.getValue()
            }),
          ),
        ),
      )
    },
  })
}
