import { useEffect } from "react"
import { signal, useMutation } from "reactjrx"
import { map } from "rxjs"
import { loadScript } from "../../../common/utils"
import { retryOnFailure } from "./scripts"

const GSI_ID = "oboku-google-gsi-script"

export const gsiSignal = signal<
  { gsi: typeof google; state: "loaded" } | { gsi: undefined; state: "loading" }
>({
  default: { gsi: undefined, state: "loading" }
})

export const gsiOrThrow$ = gsiSignal.subject.pipe(
  map(({ gsi }) => {
    if (!gsi) {
      throw new Error("gsi not available")
    }

    return gsi
  })
)

export const useLoadGsi = () => {
  const { mutate } = useMutation({
    mapOperator: "switch",
    mutationFn: () =>
      loadScript({
        id: GSI_ID,
        src: "https://accounts.google.com/gsi/client"
      }).pipe(
        retryOnFailure,
        map(() => {
          gsiSignal.setValue({
            gsi: window.google,
            state: "loaded"
          })

          return gsiSignal.getValue()
        })
      )
  })

  useEffect(() => {
    mutate()
  }, [mutate])
}
