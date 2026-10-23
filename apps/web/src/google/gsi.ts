import { signal, useSwitchMutation$ } from "reactjrx"
import { map } from "rxjs"
import { retryOnFailure } from "../common/network/retryOnFailure"
import { loadScript } from "../common/scripts"

const GSI_ID = "oboku-google-gsi-script"

export const gsiSignal = signal<
  { gsi: typeof google; state: "loaded" } | { gsi: undefined; state: "loading" }
>({
  default: { gsi: undefined, state: "loading" },
})

export const gsiOrThrow$ = gsiSignal.subject.pipe(
  map(({ gsi }) => {
    if (!gsi) {
      throw new Error("gsi not available")
    }

    return gsi
  }),
)

export const useLoadGsi = () => {
  return useSwitchMutation$({
    scope: {
      id: "google-gsi",
    },
    mutationFn: () =>
      loadScript({
        id: GSI_ID,
        src: "https://accounts.google.com/gsi/client",
      }).pipe(
        retryOnFailure,
        map(() => {
          gsiSignal.setValue({
            gsi: window.google,
            state: "loaded",
          })

          return gsiSignal.getValue()
        }),
      ),
  })
}
