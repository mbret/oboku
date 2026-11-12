import { signal, useSwitchMutation$ } from "reactjrx"
import { map } from "rxjs"
import { retryOnFailure } from "../../common/network/retryOnFailure"
import { loadScript } from "../../common/scripts"

const GSI_ID = "oboku-google-gsi-script"

export const gsiSignal = signal<
  { gsi: typeof google; state: "loaded" } | { gsi: undefined; state: "loading" }
>({
  default: { gsi: undefined, state: "loading" },
})

const GSI_NOT_LOADED_MESSAGE =
  "Google's sign-in script has not loaded. Make sure nothing blocks accounts.google.com, then try again."

export const getGsiOrThrow = () => {
  const { gsi } = gsiSignal.getValue()

  if (!gsi) throw new Error(GSI_NOT_LOADED_MESSAGE)

  return gsi
}

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
          gsiSignal.update({
            gsi: window.google,
            state: "loaded",
          })

          return gsiSignal.getValue()
        }),
      ),
  })
}
